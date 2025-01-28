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
