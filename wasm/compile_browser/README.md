```sh
cd wasm/compile_browser

wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-29/wasi-sdk-29.0-x86_64-linux.tar.gz
tar -xvf wasi-sdk-29.0-x86_64-linux.tar.gz
```

```sh
wasi-sdk-29.0-x86_64-linux/bin/clang --sysroot=wasi-sdk-29.0-x86_64-linux/share/wasi-sysroot \
  --target=wasm32-wasip1 \
  -O3 \
  -o main.wasm main.c

```

```sh
v -http -d http_folder=.
```
