import { screen } from "electron";
import type { MainApp } from "../app/mainApp";
import { ipc } from "./ipcMethods";

export function setupSystemIpc(app: MainApp) {
  ipc.handle("system:get-displays", () => {
    const primaryId = screen.getPrimaryDisplay().id;
    return screen.getAllDisplays().map((d) => ({
      id: d.id,
      label: d.label,
      primary: d.id === primaryId,
      bounds: { ...d.bounds }
    }));
  });

  ipc.handle("serial:list-ports", () => app.service.serial.list().catch(() => []));

  ipc.handle("app:relaunch", async () => {
    if (app.state.window.editor && !(await app.editorSave.requestEditorSave())) return false;
    app.system.app.relaunch();
    app.system.app.quit();
    return true;
  });
}
