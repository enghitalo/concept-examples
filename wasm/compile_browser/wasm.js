async function loadWasm() {
    const response = await fetch("main.wasm");
    const bytes = await response.arrayBuffer();

    let wasmInstance; // Declare wasmInstance in a higher scope

    // Create a more complete WASI Preview 1 implementation
    const wasiImport = {
        args_get: (argv, argv_buf) => 0,
        args_sizes_get: (argc, argv_buf_size) => 0,
        environ_get: (environ, environ_buf) => 0,
        environ_sizes_get: (environ_count, environ_buf_size) => 0,
        fd_close: (fd) => 0,
        fd_fdstat_get: (fd, stat) => {
            // Return that this is a character device
            if (fd === 1 || fd === 2) {
                const view = new DataView(wasmInstance.exports.memory.buffer);
                view.setUint8(stat, 2); // File type: character device
                return 0;
            }
            return 8; // Bad file descriptor
        },
        fd_seek: (fd, offset, whence, newOffset) => 8, // ESPIPE - not seekable
        fd_write: (fd, iovs, iovs_len, nwritten) => {
            if (fd === 1 || fd === 2) { // stdout or stderr
                const memory = wasmInstance.exports.memory.buffer;
                let written = 0;

                for (let i = 0; i < iovs_len; i++) {
                    const iov = iovs + i * 8;
                    const dataView = new DataView(memory);
                    const ptr = dataView.getUint32(iov, true);
                    const len = dataView.getUint32(iov + 4, true);

                    const bytes = new Uint8Array(memory, ptr, len);
                    const text = new TextDecoder().decode(bytes);

                    // Output to browser console
                    if (fd === 1) {
                        console.log(text);
                    } else {
                        console.error(text);
                    }

                    written += len;
                }

                // Write the total bytes written back to memory
                const nwrittenView = new DataView(memory);
                nwrittenView.setUint32(nwritten, written, true);
                return 0;
            }
            return 8; // Bad file descriptor for other FDs
        },
        proc_exit: (code) => {
            throw new Error(`Process exited with code: ${code}`);
        }
    };

    try {
        const { instance } = await WebAssembly.instantiate(bytes, {
            wasi_snapshot_preview1: wasiImport
        });

        wasmInstance = instance; // Assign the instance after instantiation

        // Initialize the WASI runtime if needed
        if (wasmInstance.exports._initialize) {
            wasmInstance.exports._initialize();
        }

        return wasmInstance.exports;
    } catch (error) {
        console.error("Failed to instantiate WASM:", error);
        throw error;
    }
}

loadWasm().then((wasm) => {
    console.log("WASM loaded successfully!");

    // -----------------------------
    // Print Hello World
    // -----------------------------
    document.getElementById("print-btn").onclick = () => {
        try {
            wasm.print_hello_world();
            // If the function prints via stdout, it will go to console
            document.getElementById("output").textContent = "Check console for output!";
        } catch (e) {
            console.error("Error calling print_hello_world:", e);
        }
    };

    // -----------------------------
    // SUM
    // -----------------------------
    document.getElementById("sum-btn").onclick = () => {
        try {
            const a = Number(document.getElementById("num1").value);
            const b = Number(document.getElementById("num2").value);
            const result = wasm.sum(a, b);
            document.getElementById("sum-result").textContent = result;
        } catch (e) {
            console.error("Error calling sum:", e);
            document.getElementById("sum-result").textContent = "Error";
        }
    };

    // -----------------------------
    // ARRAY SORTING
    // -----------------------------
    document.getElementById("sort-btn").onclick = () => {
        try {
            const text = document.getElementById("array-input").value;
            const arr = text.split(",").map((x) => {
                const num = Number(x.trim());
                return isNaN(num) ? 0 : num;
            });

            const memory = wasm.memory;
            // Use a more reliable way to get available memory
            const ptr = wasm.__heap_base || 0x10000;

            // Write array into WebAssembly memory
            const buf = new Int32Array(memory.buffer, ptr, arr.length);
            buf.set(arr);

            // Call WASM sort function
            wasm.sort_array(ptr, arr.length);

            // Read back sorted array
            const sorted = Array.from(new Int32Array(memory.buffer, ptr, arr.length));

            const ul = document.getElementById("sorted-list");
            ul.innerHTML = "";
            sorted.forEach((n) => {
                const li = document.createElement("li");
                li.textContent = n;
                ul.appendChild(li);
            });
        } catch (e) {
            console.error("Error during sorting:", e);
        }
    };
}).catch(error => {
    console.error("WASM loading failed:", error);
    document.getElementById("output").textContent = "Failed to load WebAssembly module";
});