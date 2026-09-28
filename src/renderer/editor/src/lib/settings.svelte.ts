import type { SettingId, SettingValueMap } from "@shared/setting/settings";
import type { SettingFieldId, SettingFieldValueMap } from "@shared/setting/settingFields";
import { ipc } from "./ipc";
import type { IpcSettingKeyValueTuple } from "@shared/ipc.types";
import { registerLoad } from "./editorLoad";
import { showToast } from "./toast/toast.svelte";

export const settings = $state({} as SettingValueMap);
export const settingDefaults = $state({} as SettingFieldValueMap);

async function updateSettings() {
  const [values, defaults] = await Promise.all([
    ipc.invoke("settings:get-all"),
    ipc.invoke("settings:get-defaults")
  ]);
  Object.assign(settings, values);
  Object.assign(settingDefaults, defaults);
}
registerLoad(updateSettings());

const SAVE_DEBOUNCE_MS = 250;

const saveTimeoutMap = new Map<SettingId, NodeJS.Timeout>();

async function saveSetting(key: SettingId, value: unknown) {
  const ok = await ipc
    .invoke("settings:set", [key, value] as IpcSettingKeyValueTuple)
    .catch(() => false);
  if (ok) return true;

  const stored = await ipc.invoke("settings:get", key).catch(() => undefined);
  if (stored !== undefined && Object.is(settings[key], value))
    (settings as Record<SettingId, unknown>)[key] = stored;
  showToast({ type: "error", title: "설정을 저장하지 못했습니다.", content: key });
  return false;
}

export function setSetting<T extends IpcSettingKeyValueTuple>(key: T[0], value: T[1], now = false) {
  settings[key] = value as (typeof settings)[typeof key];

  const t = saveTimeoutMap.get(key);
  if (t) {
    clearTimeout(t);
    saveTimeoutMap.delete(key);
  }
  if (now) return saveSetting(key, value);
  saveTimeoutMap.set(
    key,
    setTimeout(() => {
      saveTimeoutMap.delete(key);
      saveSetting(key, value);
    }, SAVE_DEBOUNCE_MS)
  );
}

export async function resetSetting(key: SettingFieldId) {
  const t = saveTimeoutMap.get(key);
  if (t) {
    clearTimeout(t);
    saveTimeoutMap.delete(key);
  }
  const value = await ipc.invoke("settings:reset", key);
  (settings as Record<SettingId, unknown>)[key] = value;
  return value;
}

export function isSettingModified(key: SettingFieldId) {
  return key in settingDefaults && !Object.is(settings[key], settingDefaults[key]);
}
