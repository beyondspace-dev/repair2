import type { SettingId, SettingValueMap } from "@shared/setting/settings";
import { ipc } from "./ipc";
import type { IpcSettingKeyValueTuple } from "@shared/ipc.types";
import { registerLoad } from "./editorLoad";

export let settings: SettingValueMap;

async function updateSettings() {
  settings = await ipc.invoke("settings:get-all");
}
registerLoad(updateSettings());

const SAVE_DEBOUNCE_MS = 250;

const saveTimeoutMap = new Map<SettingId, NodeJS.Timeout>();
export function setSetting<T extends IpcSettingKeyValueTuple>(key: T[0], value: T[1], now = false) {
  settings[key] = value as (typeof settings)[typeof key];

  const t = saveTimeoutMap.get(key);
  if (t) {
    clearTimeout(t);
    saveTimeoutMap.delete(key);
  }
  if (now) return ipc.invoke("settings:set", [key, value] as IpcSettingKeyValueTuple);
  saveTimeoutMap.set(
    key,
    setTimeout(() => {
      ipc.invoke("settings:set", [key, value] as IpcSettingKeyValueTuple);
    }, SAVE_DEBOUNCE_MS)
  );
}
