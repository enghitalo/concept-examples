// Defensive: input validation, allocation limits, bounds checks, reentrancy lock,
// safe malloc/free wrappers, guarded WASI fd_write, and robust memory refreshes.

// Assumes the C struct layout:
// 0: uint32_t data (pointer)
// 4: int32_t offset
// 8: int32_t len
// 12: int32_t cap
// 16: int32_t flags
// 20: int32_t element_size
// total struct size = 24 bytes

// CONFIG: tune these according to your environment
const MAX_ALLOC_BYTES = 64 * 1024 * 1024; // 64 MB max allocation per request
const MAX_ARRAY_LENGTH = 16 * 1024 * 1024; // 16M elements max (when 4 bytes each => 64MB)

async function loadWasm() {
  // fetch wasm bytes
  const response = await fetch("main.wasm");
  if (!response.ok) {
    throw new Error("Failed to fetch main.wasm: " + response.statusText);
  }
  const bytes = await response.arrayBuffer();

  const textDecoder = new TextDecoder();

  // We'll return exports after instantiation. The wasiImport must not reference wasmExports
  // during creation because imports are read at instantiate time.
  const wasiImport = Object.create(null);

  // https://wasix.org/docs/api-reference

  // minimal WASI errno constants used below
  const WASI = {
    SUCCESS: 0,
    EBADF: 8,
    EFAULT: 21,
    EIO: 28,
    ENOSYS: 52,
  };

  // args/env: advertise zero args/env and noop the getters
  wasiImport.args_sizes_get = (argcPtr, argvBufSizePtr) => {
    // report zero args / zero total size
    if (!wasmExports || !wasmExports.memory) return WASI.ENOSYS;
    try {
      const mem = wasmExports.memory.buffer;
      const dv = new DataView(mem);
      if (argcPtr + 4 <= mem.byteLength) dv.setUint32(argcPtr, 0, true);
      if (argvBufSizePtr + 4 <= mem.byteLength)
        dv.setUint32(argvBufSizePtr, 0, true);
      return WASI.SUCCESS;
    } catch (e) {
      return WASI.EIO;
    }
  };
  wasiImport.args_get = (argv, argv_buf) => {
    // no args to write; succeed as long as memory exists
    if (!wasmExports || !wasmExports.memory) return WASI.ENOSYS;
    return WASI.SUCCESS;
  };

  wasiImport.environ_sizes_get = (environCountPtr, environBufSizePtr) => {
    // no environ vars
    if (!wasmExports || !wasmExports.memory) return WASI.ENOSYS;
    try {
      const mem = wasmExports.memory.buffer;
      const dv = new DataView(mem);
      if (environCountPtr + 4 <= mem.byteLength)
        dv.setUint32(environCountPtr, 0, true);
      if (environBufSizePtr + 4 <= mem.byteLength)
        dv.setUint32(environBufSizePtr, 0, true);
      return WASI.SUCCESS;
    } catch (e) {
      return WASI.EIO;
    }
  };
  wasiImport.environ_get = (environ, environBuf) => {
    // noop: no environment variables
    if (!wasmExports || !wasmExports.memory) return WASI.ENOSYS;
    return WASI.SUCCESS;
  };

  // clocks
  wasiImport.clock_res_get = (..._args) => WASI.SUCCESS;
  wasiImport.clock_time_get = (..._args) => WASI.SUCCESS;

  // fd helpers / metadata
  wasiImport.fd_close = (..._args) => WASI.SUCCESS;
  wasiImport.fd_fdstat_get = (fd, stat) => {
    if (fd === 0 || fd === 1 || fd === 2) return WASI.SUCCESS;
    return WASI.EBADF;
  };
  wasiImport.fd_fdstat_set_flags = (..._args) => WASI.SUCCESS;
  wasiImport.fd_fdstat_set_rights = (..._args) => WASI.SUCCESS;
  wasiImport.fd_prestat_get = (fd, prestatPtr) => {
    // no preopened dirs; only std fds are valid
    if (fd === 0 || fd === 1 || fd === 2) return WASI.SUCCESS;
    return WASI.EBADF;
  };
  wasiImport.fd_prestat_dir_name = (..._args) => WASI.SUCCESS;
  wasiImport.fd_filestat_get = (..._args) => WASI.SUCCESS;
  wasiImport.fd_filestat_set_size = (..._args) => WASI.SUCCESS;
  wasiImport.fd_filestat_set_times = (..._args) => WASI.SUCCESS;

  // I/O operations
  wasiImport.fd_seek = (..._args) => WASI.EIO; // not seekable by default
  wasiImport.fd_read = (fd, iovs, iovs_len, nread) => {
    // minimal: stdin (fd=0) reads nothing; report 0 bytes read
    try {
      if (!wasmExports || !wasmExports.memory) return WASI.ENOSYS;
      if (nread + 4 > wasmExports.memory.buffer.byteLength) return WASI.EFAULT;
      const dv = new DataView(wasmExports.memory.buffer);
      dv.setUint32(nread, 0, true);
      return WASI.SUCCESS;
    } catch (e) {
      return WASI.EIO;
    }
  };

  // fd_write writes to console; uses wasm memory at runtime
  wasiImport.fd_write = (fd, iovs, iovs_len, nwritten) => {
    try {
      if (!wasmExports || !wasmExports.memory) return WASI.ENOSYS;
      const memBuf = wasmExports.memory.buffer;
      if (!(memBuf instanceof ArrayBuffer)) return WASI.ENOSYS;
      const view = new DataView(memBuf);
      let total = 0;

      // Each iovec is (ptr: u32, len: u32) => 8 bytes on wasm32
      for (let i = 0; i < iovs_len; i++) {
        const off = iovs + i * 8;
        if (off + 8 > memBuf.byteLength) return WASI.EFAULT;
        const ptr = view.getUint32(off, true);
        const len = view.getUint32(off + 4, true);
        if (ptr + len > memBuf.byteLength) return WASI.EFAULT;

        const safeLen = Math.min(len, 10_000_000);
        const bytes = new Uint8Array(memBuf, ptr, safeLen);
        const text = textDecoder.decode(bytes);

        if (fd === 1) {
          console.log(text);
        } else if (fd === 2) {
          console.error(text);
        } else {
          console.log(`[fd ${fd}]`, text);
        }
        total += safeLen;
      }

      if (nwritten + 4 > memBuf.byteLength) return WASI.EFAULT;
      view.setUint32(nwritten, total, true);
      return WASI.SUCCESS;
    } catch (e) {
      console.error("fd_write error:", e);
      return WASI.EIO;
    }
  };

  wasiImport.fd_readdir = (..._args) => WASI.SUCCESS;
  wasiImport.fd_renumber = (..._args) => WASI.SUCCESS;
  wasiImport.fd_datasync = (..._args) => WASI.SUCCESS;
  wasiImport.fd_advise = (..._args) => WASI.SUCCESS;
  wasiImport.fd_allocate = (..._args) => WASI.SUCCESS;
  wasiImport.fd_pread = (..._args) => WASI.SUCCESS;
  wasiImport.fd_pwrite = (..._args) => WASI.SUCCESS;
  wasiImport.fd_tell = (..._args) => WASI.SUCCESS;
  wasiImport.fd_sync = (..._args) => WASI.SUCCESS;

  // filesystem/path stubs — no real filesystem access; return ENOSYS or SUCCESS for no-op
  wasiImport.path_create_directory = (..._args) => WASI.ENOSYS;
  wasiImport.path_filestat_get = (..._args) => WASI.ENOSYS;
  wasiImport.path_filestat_set_times = (..._args) => WASI.ENOSYS;
  wasiImport.path_open = (..._args) => WASI.ENOSYS;
  wasiImport.path_unlink_file = (..._args) => WASI.ENOSYS;
  wasiImport.path_readlink = (..._args) => WASI.ENOSYS;
  wasiImport.path_remove_directory = (..._args) => WASI.ENOSYS;
  wasiImport.path_rename = (..._args) => WASI.ENOSYS;
  wasiImport.path_symlink = (..._args) => WASI.ENOSYS;
  wasiImport.path_link = (..._args) => WASI.ENOSYS;

  // polling / event loop
  wasiImport.poll_oneoff = (..._args) => WASI.ENOSYS;

  // process control
  wasiImport.proc_exit = (code) => {
    // prevent killing the host; throw to propagate failure
    throw new Error("WASI proc_exit called with code: " + code);
  };
  wasiImport.proc_raise = (..._args) => WASI.ENOSYS;

  // randomness
  wasiImport.random_get = (bufPtr, bufLen) => {
    try {
      if (!wasmExports || !wasmExports.memory) return WASI.ENOSYS;
      const mem = wasmExports.memory.buffer;
      if (bufPtr < 0 || bufLen < 0 || bufPtr + bufLen > mem.byteLength)
        return WASI.EFAULT;
      const slice = new Uint8Array(mem, bufPtr, bufLen);
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.getRandomValues === "function"
      ) {
        crypto.getRandomValues(slice);
        return WASI.SUCCESS;
      }
      // fallback: use Math.random (not cryptographically secure)
      for (let i = 0; i < bufLen; i++) slice[i] = (Math.random() * 256) | 0;
      return WASI.SUCCESS;
    } catch (e) {
      return WASI.EIO;
    }
  };

  // scheduling
  wasiImport.sched_yield = (..._args) => WASI.SUCCESS;

  // socket stubs — not supported in this shim
  wasiImport.sock_accept = (..._args) => WASI.ENOSYS;
  wasiImport.sock_recv = (..._args) => WASI.ENOSYS;
  wasiImport.sock_send = (..._args) => WASI.ENOSYS;
  wasiImport.sock_shutdown = (..._args) => WASI.ENOSYS;

  let wasmExports = null;

  try {
    const { instance } = await WebAssembly.instantiate(bytes, {
      wasi_snapshot_preview1: wasiImport,
    });
    wasmExports = instance.exports;

    // call optional initializer
    if (typeof wasmExports._initialize === "function") {
      try {
        wasmExports._initialize();
      } catch (e) {
        // initializer may be optional or fail; don't block normal usage
        console.warn("_initialize threw:", e);
      }
    }

    // Return a guarded wrapper around exports with safe helpers attached
    return makeSafeWasmWrapper(wasmExports);
  } catch (err) {
    console.error("Failed to instantiate WASM:", err);
    throw err;
  }
}

/* -------------------------
   Safety helpers / wrappers
   ------------------------- */

function makeSafeWasmWrapper(wasm) {
  // Validate minimal expected exports
  if (!wasm.memory || !(wasm.memory.buffer instanceof ArrayBuffer)) {
    throw new Error("WASM module missing exported memory");
  }

  // Keep track of allocations we did so freeIfPossible won't free random pointers
  const allocations = new Set();

  // Reentrancy lock: disallow nested/parallel operations that mutate shared memory
  let busy = false;
  function acquireLock() {
    if (busy)
      throw new Error("WASM wrapper is busy; concurrent calls are not allowed");
    busy = true;
  }
  function releaseLock() {
    busy = false;
  }

  function refreshMemoryView() {
    const buf = wasm.memory.buffer;
    return {
      buffer: buf,
      view: new DataView(buf),
      u8: new Uint8Array(buf),
    };
  }

  function isValidPointer(ptr) {
    // pointer must be a non-negative integer within memory bounds
    if (!Number.isInteger(ptr) || ptr < 0) return false;
    const buf = wasm.memory.buffer;
    return ptr < buf.byteLength;
  }

  function validateRange(ptr, byteLen) {
    if (!Number.isInteger(ptr) || ptr < 0) throw new Error("Invalid pointer");
    if (!Number.isInteger(byteLen) || byteLen < 0) {
      throw new Error("Invalid byte length");
    }
    const buf = wasm.memory.buffer;
    if (ptr + byteLen > buf.byteLength) {
      throw new Error("Memory access out of bounds");
    }
  }

  function safeMalloc(n) {
    if (n <= 0) throw new Error("safeMalloc: size must be > 0");
    if (n > MAX_ALLOC_BYTES) {
      throw new Error("safeMalloc: requested allocation too big");
    }
    if (typeof wasm.malloc !== "function") {
      throw new Error("WASM module does not export malloc");
    }
    const ptr = wasm.malloc(n);
    if (!ptr) throw new Error("malloc failed (returned 0)");
    // basic validation that pointer points inside memory
    if (!isValidPointer(ptr) || ptr + n > wasm.memory.buffer.byteLength) {
      // try to refresh memory (maybe memory.grow happened)
      // but if still invalid, free and throw
      try {
        if (typeof wasm.free === "function") wasm.free(ptr);
      } catch {}
      throw new Error("malloc returned invalid pointer or out-of-bounds");
    }
    allocations.add(ptr);
    return ptr;
  }

  function safeFree(ptr) {
    if (!ptr) return;
    if (!allocations.has(ptr)) {
      // Don't free pointers we didn't allocate: just warn
      console.warn("Attempted to free pointer not tracked by wrapper:", ptr);
      return;
    }
    if (typeof wasm.free !== "function") {
      allocations.delete(ptr);
      console.warn(
        "free not available on wasm exports; allocation left to GC/wasm"
      );
      return;
    }
    try {
      wasm.free(ptr);
    } catch (e) {
      console.warn("wasm.free threw:", e);
    } finally {
      allocations.delete(ptr);
    }
  }

  // Helpers specific to the array struct layout
  const STRUCT_SIZE = 24;
  function validateArrayStructPtr(structPtr) {
    if (!Number.isInteger(structPtr) || structPtr <= 0) {
      throw new Error("Invalid struct pointer");
    }
    // ensure struct region exists
    validateRange(structPtr, STRUCT_SIZE);

    // read values safely
    const mem = refreshMemoryView();
    const dv = mem.view;

    const dataPtr = dv.getUint32(structPtr + 0, true);
    const offset = dv.getInt32(structPtr + 4, true);
    const len = dv.getInt32(structPtr + 8, true);
    const cap = dv.getInt32(structPtr + 12, true);
    const flags = dv.getInt32(structPtr + 16, true);
    const elemSize = dv.getInt32(structPtr + 20, true);

    // sanity checks
    if (elemSize <= 0 || elemSize > 8) {
      throw new Error("Invalid element_size in struct");
    }
    if (len < 0 || cap < 0) throw new Error("Invalid len/cap in struct");
    if (len > cap) throw new Error("len greater than cap in struct");
    if (len > MAX_ARRAY_LENGTH) {
      throw new Error("Array len exceeds allowed maximum");
    }
    if (offset < 0) throw new Error("Negative offset not allowed");
    // validate data region lies inside memory
    const start = dataPtr + offset * elemSize;
    const byteLen = len * elemSize;
    validateRange(start, byteLen);

    return { dataPtr, offset, len, cap, flags, elemSize, start, byteLen };
  }

  // Expose a few safe utilities on the wrapper object
  const wrapper = Object.create(null);

  wrapper._raw = wasm;
  wrapper._allocations = allocations;

  wrapper.safeMalloc = safeMalloc;
  wrapper.safeFree = safeFree;
  wrapper.validateArrayStructPtr = validateArrayStructPtr;

  // Convert JS array of numbers -> allocated C array and struct pointer
  wrapper.jsArrayToCArrayStruct = (arr) => {
    if (!Array.isArray(arr)) throw new Error("Input must be an array");
    // sanitize values to 32-bit signed ints
    const ints = new Int32Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      const v = Number(arr[i]);
      if (!Number.isFinite(v)) ints[i] = 0;
      else ints[i] = v | 0;
    }
    const bytesPerElement = 4;
    const dataByteLen = ints.length * bytesPerElement;
    if (ints.length > MAX_ARRAY_LENGTH) throw new Error("Array length too big");

    const dataPtr = safeMalloc(dataByteLen);
    // write into memory (refresh view)
    const mem = refreshMemoryView();
    const intView = new Int32Array(mem.buffer, dataPtr, ints.length);
    intView.set(ints);

    // allocate struct
    const structPtr = safeMalloc(STRUCT_SIZE);
    const dv = new DataView(wasm.memory.buffer);
    dv.setUint32(structPtr + 0, dataPtr, true); // data pointer
    dv.setInt32(structPtr + 4, 0, true); // offset
    dv.setInt32(structPtr + 8, ints.length, true); // len
    dv.setInt32(structPtr + 12, ints.length, true); // cap
    dv.setInt32(structPtr + 16, 0, true); // flags
    dv.setInt32(structPtr + 20, bytesPerElement, true); // element_size

    return { structPtr, dataPtr, length: ints.length };
  };

  // Convert C array struct to JS array (reads memory after validation)
  wrapper.cArrayStructToJsArray = (structPtr) => {
    const info = validateArrayStructPtr(structPtr);
    const { start, len, elemSize } = info;
    const mem = refreshMemoryView();

    if (elemSize === 4)
      return Array.from(new Int32Array(mem.buffer, start, len));
    if (elemSize === 2)
      return Array.from(new Int16Array(mem.buffer, start, len));
    if (elemSize === 1)
      return Array.from(new Int8Array(mem.buffer, start, len));
    if (elemSize === 8 && typeof BigInt64Array !== "undefined") {
      return Array.from(new BigInt64Array(mem.buffer, start, len)).map((v) =>
        typeof v === "bigint" ? Number(v) : v
      );
    }
    // fallback: read per-element
    const dv = mem.view;
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
      let val = 0;
      const off = start + i * elemSize;
      for (let b = 0; b < elemSize; b++) {
        val |= dv.getUint8(off + b) << (8 * b);
      }
      const bits = elemSize * 8;
      const sign = 1 << (bits - 1);
      if (val & sign) val = val - (1 << bits);
      out[i] = val;
    }
    return out;
  };

  // call an exported void function that expects structPtr (like sort_array)
  wrapper.callSortArray = (structPtr) => {
    if (typeof wasm.sort_array !== "function") {
      throw new Error("sort_array not exported by wasm module");
    }
    acquireLock();
    try {
      // validate struct before calling into wasm
      validateArrayStructPtr(structPtr);
      // Call into wasm; catch and rethrow with context
      try {
        wasm.sort_array(structPtr);
      } catch (e) {
        throw new Error(
          "WASM sort_array() threw: " + (e && e.message ? e.message : e)
        );
      }
    } finally {
      releaseLock();
    }
  };

  // safe free helper that only frees allocations created by wrapper
  wrapper.freeIfPossible = (ptr) => {
    try {
      safeFree(ptr);
    } catch (e) {
      console.warn("freeIfPossible error:", e);
    }
  };

  // expose raw helper for advanced usage but warn
  wrapper._unsafe = Object.freeze({
    rawExports: wasm,
    validateRange,
    refreshMemoryView,
  });

  // Prevent prototype pollution on returned object
  return Object.freeze(wrapper);
}

/* -------------------------
   UI wiring — use safe wrappers
   ------------------------- */

loadWasm()
  .then((wasmWrapper) => {
    console.log("WASM loaded and wrapped safely.");

    // helper to safely read integer inputs from DOM
    function safeNumberFromId(id, fallback = 0) {
      const el = document.getElementById(id);
      if (!el) return fallback;
      const raw = String(el.value || "").trim();
      // disallow extremely long strings
      if (raw.length > 100) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    // PRINT button
    const printBtn = document.getElementById("print-btn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        try {
          const raw = wasmWrapper._unsafe.rawExports;
          if (typeof raw.print_hello_world === "function") {
            raw.print_hello_world();
            const out = document.getElementById("output");
            if (out) out.textContent = "Printed to console.";
          } else {
            console.warn("print_hello_world not exported");
          }
        } catch (e) {
          console.error("Error calling print_hello_world:", e);
        }
      });
    }

    // SUM button
    const sumBtn = document.getElementById("sum-btn");
    if (sumBtn) {
      sumBtn.addEventListener("click", () => {
        try {
          const a = safeNumberFromId("num1", 0);
          const b = safeNumberFromId("num2", 0);
          const raw = wasmWrapper._unsafe.rawExports;
          if (typeof raw.sum !== "function") {
            const out = document.getElementById("sum-result");
            if (out) out.textContent = "sum not exported";
            return;
          }
          const res = raw.sum(a | 0, b | 0);
          const out = document.getElementById("sum-result");
          if (out) out.textContent = String(res);
        } catch (e) {
          console.error("Error calling sum:", e);
          const out = document.getElementById("sum-result");
          if (out) out.textContent = "Error";
        }
      });
    }

    // SORT button
    const sortBtn = document.getElementById("sort-btn");
    if (sortBtn) {
      sortBtn.addEventListener("click", () => {
        (async () => {
          try {
            // read and sanitize input text
            const raw = (
              document.getElementById("array-input")?.value || ""
            ).trim();
            if (raw.length === 0) {
              const ul = document.getElementById("sorted-list");
              if (ul) ul.innerHTML = "<li>(empty)</li>";
              return;
            }
            // parse numbers: only allow up to MAX_ARRAY_LENGTH elements
            const tokens = raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (tokens.length > MAX_ARRAY_LENGTH)
              throw new Error("Input array too large");
            const arr = tokens.map((t) => {
              const n = Number(t);
              return Number.isFinite(n) ? n | 0 : 0;
            });

            // create C array and struct (wrapper enforces strict safety)
            const { structPtr, dataPtr, length } =
              wasmWrapper.jsArrayToCArrayStruct(arr);

            // call sort
            wasmWrapper.callSortArray(structPtr);

            // read back results
            const sorted = wasmWrapper.cArrayStructToJsArray(structPtr);

            // show results
            const ul = document.getElementById("sorted-list");
            if (ul) {
              ul.innerHTML = "";
              for (const n of sorted) {
                const li = document.createElement("li");
                li.textContent = String(n);
                ul.appendChild(li);
              }
            }

            // free memory we allocated
            wasmWrapper.freeIfPossible(dataPtr);
            wasmWrapper.freeIfPossible(structPtr);
          } catch (e) {
            console.error("Error during safe sort operation:", e);
            const ul = document.getElementById("sorted-list");
            if (ul) ul.innerHTML = "<li>Error: see console</li>";
          }
        })();
      });
    }
  })
  .catch((err) => {
    console.error("Failed to load safe wasm wrapper:", err);
    const out = document.getElementById("output");
    if (out) out.textContent = "Failed to load module safely; see console.";
  });
