# Vite WASM App

## Init

npm create vite@latest vite-app -- --template vanilla-ts

cat > vite.config.js

```ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [
    wasm(),
    // topLevelAwait() // Not needed if build.target == 'esnext'
  ],
});
```

## Run

```sh
# /$HOME/wasi-sdk-25.0-x86_64-linux/bin/clang --sysroot=/$HOME/wasi-sdk-25.0-x86_64-linux/share/wasi-sysroot -o src/hello.wasm src/hello.c
emcc src/hello.c -o src/hello.wasm -s STANDALONE_WASM=1

# npm run dev
emcc src/hello.c -o src/hello.wasm -s STANDALONE_WASM=1 && npm run build && npm run preview
```
