interface WasmExports {
  print_hello_world: () => void;
  sum: (a: number, b: number) => number;
  sort_array: (arrPtr: number, len: number) => void;
  memory: WebAssembly.Memory;
}

// Load and compile WebAssembly module
async function getCoreModule(path: string): Promise<WebAssembly.Module> {
  const response = await fetch(new URL(`./${path}`, import.meta.url));
  if (response.headers.get("content-type") !== "application/wasm") {
    throw new Error("Invalid WASM content type. Expected application/wasm");
  }
  return WebAssembly.compileStreaming(response);
}

// Initialize the application
async function initializeApp() {
  const module = await getCoreModule("code.wasm");

  const instance = new WebAssembly.Instance(module, {
    env: {
      abort(_msg: any, _file: any, line: any, column: any) {
        console.error("abort called at index.ts:" + line + ":" + column);
      },
      printf: (ptr: number) => {
        const length = new Uint8Array(
          instance.exports.memory.buffer,
          ptr
        ).findIndex((byte) => byte === 0);
        const value = new TextDecoder().decode(
          new Uint8Array(instance.exports.memory.buffer, ptr, length)
        );
        console.log(value);
      },
      qsort: (ptr: number, len: number, size: number, compare_fn: number) => {
        const arr = new Int32Array(
          instance.exports.memory.buffer,
          ptr,
          len * size
        );
        arr.sort((a, b) => {
          const fn = new Function(
            "a",
            "b",
            "return " +
              new TextDecoder().decode(
                new Uint8Array(instance.exports.memory.buffer, compare_fn, 100)
              )
          );
          return fn(a, b);
        });
      },
    },
  });

  setupUI(instance.exports as unknown as WasmExports);
}

// UI setup with proper memory management
function setupUI(wasmExports: WasmExports) {
  // Print Hello World
  document.getElementById("print-btn")?.addEventListener("click", () => {
    wasmExports.print_hello_world();
  });

  // Sum
  document.getElementById("sum-btn")?.addEventListener("click", () => {
    const num1 = Number(
      (document.getElementById("num1") as HTMLInputElement)?.value
    );
    const num2 = Number(
      (document.getElementById("num2") as HTMLInputElement)?.value
    );
    const result = wasmExports.sum(num1, num2);
    document.getElementById("sum-result")!.textContent = `Sum: ${result}`;
  });

  // Sort Array
  document.getElementById("sort-btn")?.addEventListener("click", () => {
    const input = (document.getElementById("array-input") as HTMLInputElement)
      ?.value;
    const numbers = input
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));
    if (numbers.length > 0) {
      const arrLen = numbers.length;
      const arrPtr = wasmExports.malloc(arrLen * 4); // Allocate memory for array of 32-bit integers
      const arr = new Int32Array(wasmExports.memory.buffer, arrPtr, arrLen);
      arr.set(numbers);
      wasmExports.sort_array(arrPtr, arrLen);
      document.getElementById("sorted-list")!.textContent = arr.join(", ");
      wasmExports.free(arrPtr); // Free memory after use
    }
  });
}

document.addEventListener("DOMContentLoaded", initializeApp);
