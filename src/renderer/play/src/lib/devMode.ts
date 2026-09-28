import { ipc } from "./ipc";

let devMode = !!ipc.sendSync("settings:dev-mode");

ipc.on("settings:changed", (_evt, [key, value]) => {
  if (key === "devMode") devMode = value;
});

export function isDevMode() {
  return devMode;
}
