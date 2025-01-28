import "./style.css";
import { setupCounter } from "./counter.ts";
import { init, runWasix } from "@wasmer/sdk";
import helloUrl from "./hello.wasm?url";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);

async function initialize() {
  await init();
  return WebAssembly.compileStreaming(fetch(helloUrl));
}

async function runWasm(module: WebAssembly.Module) {
  const instance = await runWasix(module, {});

  const result = await instance.wait();
  return result.ok ? result.stdout : null;
}

async function main() {
  const module = await initialize();
  const stdout = await runWasm(module);
  console.log(stdout);
}

main();
