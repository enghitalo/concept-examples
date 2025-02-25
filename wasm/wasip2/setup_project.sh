#!/bin/bash

# Script to set up a TypeScript project with WebAssembly/WASI Preview 2 on Linux

echo "Starting project setup..."

# Step 1: Install necessary tools
echo "Checking and installing required tools..."

# Check and install WASI SDK (version 25.0)
WASI_SDK_PATH="/opt/wasi-sdk"
if [ ! -d "$WASI_SDK_PATH" ]; then
    echo "WASI SDK not found. Installing version 25.0..."
    wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-25/wasi-sdk-25.0-x86_64-linux.tar.gz
    tar -xzf wasi-sdk-25.0-x86_64-linux.tar.gz
    sudo mkdir -p /opt/wasi-sdk
    sudo mv ./wasi-sdk-25.0-x86_64-linux/* /opt/wasi-sdk/
    rm -rf ./wasi-sdk-25.0-x86_64-linux wasi-sdk-25.0-x86_64-linux.tar.gz
    if [ $? -ne 0 ]; then
        echo "Failed to install WASI SDK. Please install it manually from https://github.com/WebAssembly/wasi-sdk/releases and rerun the script."
        exit 1
    fi
else
    echo "WASI SDK is already installed at $WASI_SDK_PATH."
fi

# Check and install wasm-tools
if ! command -v wasm-tools &>/dev/null; then
    echo "wasm-tools not found. Installing via cargo..."
    rustup update
    cargo install wasm-tools
    if [ $? -ne 0 ]; then
        echo "Failed to install wasm-tools. Ensure Rust and cargo are installed and rerun the script."
        exit 1
    fi
else
    echo "wasm-tools is already installed."
fi

# Verify Node.js
if ! command -v node &>/dev/null; then
    echo "Node.js required - install from https://nodejs.org/"
    exit 1
fi

# Step 2: Initialize project
echo "Initializing project..."
mkdir -p src dist bindings
npm init -y

# Step 3: Install dependencies
echo "Installing dependencies..."
npm install --save-dev \
    typescript \
    rollup \
    @rollup/plugin-node-resolve \
    @rollup/plugin-typescript \
    rollup-plugin-copy \
    @bytecodealliance/preview2-shim \
    @bytecodealliance/jco

# Step 4: Write C code
echo "Writing C code..."
cat <<EOF >src/code.c
#include <stdio.h>
#include <stdlib.h>

// Export using __attribute__ for explicit control
__attribute__((export_name("print_hello_world")))
void print_hello_world() {
    printf("Hello, World!\\n");
}

__attribute__((export_name("sum")))
int sum(int a, int b) {
    return a + b;
}

int compare(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

__attribute__((export_name("sort_array")))
void sort_array(int* arr, size_t len) {
    qsort(arr, len, sizeof(int), compare);
}
EOF

# Step 5: Compile to component model
echo "Compiling C code to WebAssembly with WASI SDK..."
$WASI_SDK_PATH/bin/clang --target=wasm32-wasip2 \
    -Wl,--export-all \
    -Wl,--no-entry \
    --sysroot=$WASI_SDK_PATH/share/wasi-sysroot \
    -o src/code.wasm \
    src/code.c

# https://github.com/WebAssembly/wasi-cli
# First convert core wasm to component model
# Then validate and process
echo "Creating WebAssembly component..."
wasm-tools component new src/code.wasm -o src/code.wasm

# Step 6: Generate TypeScript bindings
echo "Generating bindings..."
# npx jco transpile src/component.wasm --map wasi:cli/*@0.2.0=@bytecodealliance/preview2-shim/cli#*
npx jco transpile src/code.component.wasm -o src/bindings --ts

# Step 7: Configure TypeScript
echo "Configuring TypeScript..."
cat <<EOF >tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["DOM", "ESNext"],
    "strict": true,
    "outDir": "dist"
    "moduleResolution": "NodeNext",
    "types": ["@bytecodealliance/preview2-shim"],
  }
}
EOF

# Step 8: Configure Rollup
echo "Configuring Rollup..."
cat <<EOF >rollup.config.js
import resolve from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve(),
    typescript(),
    copy({
      targets: [
        { src: 'src/bindings/*.wasm', dest: 'dist/bindings' },
        { src: 'index.html', dest: 'dist' }
      ]
    })
  ]
}
EOF

# Step 9: Write main application code
echo "Writing main.ts..."
cat <<EOF >src/main.ts
import { Preview2 } from '@bytecodealliance/preview2-shim'
import { instantiate } from './bindings/code.component'

async function initializeApp() {
  const wasi = new Preview2.Wasi()
  
  const { instance } = await instantiate({
    'wasi:cli/base': wasi.base,
    'wasi:io/streams': wasi.streams
  }, {
    'wasi:cli/environment': { get_environment: () => [] },
    'wasi:cli/exit': { exit: (code: number) => console.log(\`Exited: \${code}\`) }
  })

  // Capture stdout
  wasi.stdout?.pipeTo(new WritableStream({
    write(chunk) {
      document.getElementById('output')!.textContent += new TextDecoder().decode(chunk)
    }
  }))

  // Event handlers
  document.getElementById('print-btn')!.addEventListener('click', () => {
    instance.exports.print_hello_world()
  })

  document.getElementById('sum-btn')!.addEventListener('click', () => {
    const num1 = parseInt((document.getElementById('num1') as HTMLInputElement).value || 0
    const num2 = parseInt((document.getElementById('num2') as HTMLInputElement).value || 0
    const result = instance.exports.sum(num1, num2)
    document.getElementById('sum-result')!.textContent = \`Result: \${result}\`
  })

  document.getElementById('sort-btn')!.addEventListener('click', () => {
    const input = (document.getElementById('array-input') as HTMLInputElement).value
    const numbers = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    
    const memory = instance.exports.memory as WebAssembly.Memory
    const buffer = new Uint8Array(memory.buffer)
    const offset = 0x10000 // Start at 64KB offset
    
    // Ensure sufficient memory
    const neededBytes = numbers.length * 4
    if (offset + neededBytes > buffer.length) {
      memory.grow(Math.ceil((offset + neededBytes - buffer.length) / 65536))
    }

    // Write numbers to memory
    const view = new DataView(memory.buffer)
    numbers.forEach((n, i) => view.setInt32(offset + i * 4, n, true))
    
    // Sort and read back
    instance.exports.sort_array(offset, numbers.length)
    const sorted = new Int32Array(memory.buffer, offset, numbers.length)
    
    const list = document.getElementById('sorted-list')!
    list.innerHTML = ''
    sorted.forEach(num => {
      const li = document.createElement('li')
      li.textContent = num.toString()
      list.appendChild(li)
    })
  })
}

window.addEventListener('load', initializeApp)
EOF

# Step 10: Create HTML file
echo "Creating index.html..."
cat <<EOF >index.html
<!DOCTYPE html>
<html>
<head>
  <title>WebAssembly Interactive WASI Preview 2 Demo</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    section { margin-bottom: 20px; }
    button { margin-left: 10px; }
    #output { font-weight: bold; }
    #sum-result { color: green; }
    #sorted-list { list-style-type: decimal; }
  </style>
</head>
<body>
  <section>
    <h2>Hello World</h2>
    <button id="print-btn">Print Hello</button>
    <p id="output"></p>
  </section>

  <section>
    <h2>Calculator</h2>
    <input type="number" id="num1" placeholder="Number 1">
    <input type="number" id="num2" placeholder="Number 2">
    <button id="sum-btn">Sum</button>
    <p id="sum-result"></p>
  </section>

  <section>
    <h2>Array Sorting</h2>
    <input type="text" id="array-input" placeholder="Enter numbers (e.g., 4,2,3,1)" />
    <button id="sort-btn">Sort</button>
    <ul id="sorted-list"></ul>
  </section>

  <script type="module" src="dist/main.js"></script>
</body>
</html>
EOF

# Step 11: Build project
echo "Building the project with Rollup..."
npx rollup -c
if [ $? -ne 0 ]; then
    echo "Failed to build the project with Rollup. Check the configuration and dependencies."
    exit 1
fi

echo "Setup complete! Serve the dist directory with:"
echo "  npx serve dist"
