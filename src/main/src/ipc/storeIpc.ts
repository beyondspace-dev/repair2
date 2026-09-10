import type { MainApp } from "../app/mainApp";
import { ipc } from "./ipcMethods";

export function setupStoreIpc(app: MainApp) {
  ipc.handle("get-store", (evt, key) => {
    return app.store.get(key, true);
  });
  ipc.handle("set-store", (evt, key, value) => {
    return app.store.set(key, value, true);
  });

  ipc.handle("settings:get", (evt, key) => {
    return app.settings.get(key);
  });
  ipc.handle("settings:set", (evt, key, value) => {
    return app.settings.set(key, value);
  });
  ipc.handle("settings:get-all", () => app.settings.getAll());
}
