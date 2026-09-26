/**
 * Preloaded with `--import` to run editor tests under plain Node.
 * Registers the module hooks and provides inert browser globals, since editor modules
 * touch the DOM and Electron APIs while being imported.
 */
import { register } from "node:module";

register(new URL("./hooks.mjs", import.meta.url));

function inert() {
  return new Proxy(function () {}, {
    get(_, key) {
      if (key === Symbol.toPrimitive) return () => "";
      if (key === "then") return undefined;
      if (key === "getItem") return () => null;
      return inert();
    },
    apply: () => inert(),
    construct: () => inert()
  });
}

globalThis.document ??= inert();
globalThis.window ??= inert();
globalThis.localStorage ??= inert();
globalThis.requestAnimationFrame ??= (callback) => setTimeout(() => callback(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);

if (globalThis.navigator && !("windowControlsOverlay" in globalThis.navigator)) {
  Object.defineProperty(globalThis.navigator, "windowControlsOverlay", { value: inert() });
}

for (const name of [
  "ResizeObserver",
  "MutationObserver",
  "IntersectionObserver",
  "HTMLElement",
  "Element",
  "Node",
  "customElements",
  "getComputedStyle",
  "matchMedia",
  "CSS",
  "Image",
  "DOMParser"
]) {
  if (!(name in globalThis)) globalThis[name] = inert();
}
