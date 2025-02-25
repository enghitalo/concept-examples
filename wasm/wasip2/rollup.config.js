import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/bundle.js", // Matches your index.html script src
    format: "es", // Changed from iife to es modules
    // name: "app", // Optional global name
    inlineDynamicImports: true,
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }), // Resolves node_modules imports if any
    commonjs(), // Converts CommonJS modules to ES modules if needed
    copy({
      targets: [
        // { src: "src/bindings/*.wasm", dest: "dist/bindings" },
        { src: "src/index.html", dest: "dist" },
      ],
    }),
  ],
  // context: "window",
};
