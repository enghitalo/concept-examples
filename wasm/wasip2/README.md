```sh
.
├── code.wat
├── dist
│   └── code.wasm
├── package.json
├── package-lock.json
├── README.md
├── rollup.config.js
├── setup_project.sh
├── src
│   ├── code.c
│   ├── index.html
│   └── main.ts
└── tsconfig.json
```

```sh
WASI_SDK_PATH="/opt/wasi-sdk"
/opt/wasi-sdk/bin/clang --target=wasm32-wasip2 -Wl,--export-all -Wl,--no-entry --sysroot=$WASI_SDK_PATH/share/wasi-sysroot src/code.c -o dist/code.wasm


/opt/wasi-sdk/bin/clang     \
    -O0 -z stack-size=4096 -Wl,--initial-memory=65536 \
    -Wl,--no-entry -nostdlib \
    -Wl,--strip-all \
    -Wl,--export-all \
    -Wl,--allow-undefined \
    -o dist/code.wasm src/code.c
```

```sh
wasm-tools validate dist/code.wasm
```

### Minimal WASI Preview 2 (wasip2) shim for browser environment

```sh
# --no-nodejs-compat
# --no-wasi-shim \
npx jco transpile dist/code.wasm  --instantiation async -o dist

npx jco transpile dist/code.wasm -o dist \
  --no-nodejs-compat

npx jco transpile dist/code.wasm -o dist \
  --minify \
  --optimize \
  --no-nodejs-compat \
  --instantiation async
```

```sh
npx rollup -c
npx serve dist
```

```sh

```

```sh

```

```sh

```
