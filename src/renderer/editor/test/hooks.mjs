/**
 * Module hooks for running editor tests under plain Node.
 * - `electron` resolves to a stub that only provides inert `clipboard` / `ipcRenderer`.
 * - `.svelte.ts` / `.svelte.js` modules are compiled with the Svelte compiler so runes work.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const svelteCompilerUrl = pathToFileURL(require.resolve("svelte/compiler")).href;
const esbuild = require("esbuild");

const electronStub = `
export const clipboard = {
  readBuffer: () => Buffer.alloc(0),
  writeBuffer: () => {},
  readText: () => "",
  writeText: () => {},
  availableFormats: () => []
};
export const ipcRenderer = {
  on: () => ipcRenderer,
  once: () => ipcRenderer,
  off: () => ipcRenderer,
  removeListener: () => ipcRenderer,
  removeAllListeners: () => ipcRenderer,
  send: () => {},
  sendSync: () => undefined,
  invoke: async () => undefined,
  postMessage: () => {}
};
export default { clipboard, ipcRenderer };
`;

export async function resolve(specifier, context, next) {
  if (specifier === "electron") {
    return {
      url: "data:text/javascript," + encodeURIComponent(electronStub),
      shortCircuit: true
    };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  const result = await next(url, context);
  const pathname = url.startsWith("file:") ? new URL(url).pathname : "";
  if (!/\.svelte\.(ts|js)$/.test(pathname)) return result;

  const compiler = await import(svelteCompilerUrl);
  const compileModule = compiler.compileModule ?? compiler.default.compileModule;
  const source =
    typeof result.source === "string" ? result.source : new TextDecoder().decode(result.source);
  const js = pathname.endsWith(".ts")
    ? (await esbuild.transform(source, { loader: "ts", format: "esm", target: "esnext" })).code
    : source;
  const compiled = compileModule(js, { generate: "client", filename: pathname });
  return { format: "module", source: compiled.js.code, shortCircuit: true };
}
