import { ipcRenderer } from "electron";
import { join } from "path";

export const dataDir = ipcRenderer.sendSync("getDataDir");
export const assetDir = join(dataDir, "assets");
export const pluginDir = join(dataDir, "plugins");

export function getAssetDir(dir: string): string {
  return join(assetDir, dir);
}
