```sh
wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-29/wasi-sdk-29.0-x86_64-linux.tar.gz
tar -xvf wasi-sdk-29.0-x86_64-linux.tar.gz

wasi-sdk-29.0-x86_64-linux/bin/clang --sysroot=wasi-sdk-29.0-x86_64-linux/share/wasi-sysroot \
  # --target=wasm32-wasi \
  # --target=wasm32-wasip1 \
  --target=wasm32-wasip2 \
  -O3 \
  -o main.wasm main.c

```

```sh



```

```sh
v -http -d http_folder=examples/compile_browser
```
