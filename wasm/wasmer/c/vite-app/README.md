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
# compile the C code
clang --target=wasm32 \
--no-standard-libraries \
-Wl,--export-all \
#   Don't search for the entry point symbol (by default ``_start``).
-Wl,--no-entry \
 -o src/hello.wasm src/hello.c

#  Run Vite
npm run build && npm run preview
```
