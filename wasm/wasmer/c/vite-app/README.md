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
npm run dev
```
