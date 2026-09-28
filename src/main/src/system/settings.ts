import { screen } from "electron";
import type { MainApp } from "../app/mainApp";
import { Store } from "./store";
import { SettingFields } from "@shared/setting/settingFields";
import type { SettingValueMap, SettingId } from "@shared/setting/settings";
import type { SettingFieldId, SettingFieldValueMap } from "@shared/setting/settingFields";
import { join } from "path";
import { DefaultInternalSettings } from "@shared/setting/internalSettings";
import type { IpcSettingKeyValueTuple } from "@shared/ipc.types";
import { hasModifier, parseAccelerator } from "@shared/accelerator";

function createDefaultSettingMap() {
  const result: Partial<{
    -readonly [k in SettingId]: SettingValueMap[k] | ((app: MainApp) => SettingValueMap[k]);
  }> = {
    ...DefaultInternalSettings
  };
  SettingFields.forEach((f) => {
    if ("default" in f) result[f.id] = f.default as any;
    else if (f.id === "projectPath")
      result[f.id] = (app) =>
        join(app.system.app.getPath("userData"), app.isDev ? "dev_project" : "project");
    else if (f.id === "anchorDisplay") result[f.id] = () => screen.getPrimaryDisplay().id;
    else if (f.id === "startOnBoot") result[f.id] = (app) => app.system.boot.getAutoStartOpt();
    else result[f.id] = null;
  });

  return result as {
    [k in keyof SettingValueMap]: SettingValueMap[k] | ((app: MainApp) => SettingValueMap[k]);
  };
}
const defaultSettings = createDefaultSettingMap();

function isValidSettingValue(key: SettingId, value: unknown) {
  const field = SettingFields.find((f) => f.id === key);
  if (!field || value === null) return true;
  if (field.type !== "accelerator") return true;

  const accel = typeof value === "string" ? parseAccelerator(value) : null;
  return !!accel && (!field.requireModifier || hasModifier(accel));
}

const PlaySyncedSettings = new Set<SettingId>([
  "audioOutputHardware",
  "editorAccelerator",
  "editorPassword",
  "devMode"
]);

export class Settings {
  constructor(private readonly app: MainApp) {}

  async getAll(forceUpdate: boolean = false) {
    const settings = await this.app.store.get(Store.SETTING_KEY, forceUpdate, false);
    return Object.fromEntries(
      (Object.keys(defaultSettings) as SettingId[]).map((id) => {
        return [id, this.processSettingValue(id, settings[id])];
      })
    ) as SettingValueMap;
  }
  async get<K extends SettingId>(
    key: K,
    forceUpdate: boolean = false
  ): Promise<SettingValueMap[K]> {
    return this.processSettingValue(
      key,
      await this.app.store.get([Store.SETTING_KEY, key], forceUpdate, false)
    );
  }
  async set<K extends SettingId>(key: K, value: SettingValueMap[K]) {
    if (!isValidSettingValue(key, value)) return false;
    if ((await this.get(key)) === value) return true;

    const ok = await this.app.store
      .set([Store.SETTING_KEY, key], value, false)
      .then(() => true)
      .catch(() => false);
    if (!ok) return false;

    this.afterSetSetting(key, value);
    return true;
  }

  async reset<K extends SettingFieldId>(key: K): Promise<SettingValueMap[K]> {
    const prev = await this.get(key);
    await this.app.store.delete([Store.SETTING_KEY, key], false);
    const value = await this.get(key);
    if (prev !== value) this.afterSetSetting(key, value);
    return value;
  }

  getDefaults() {
    return Object.fromEntries(
      SettingFields.map((f) => [f.id, this.getDefaultValue(f.id)])
    ) as SettingFieldValueMap;
  }

  private processSettingValue<K extends SettingId>(
    id: K,
    value?: SettingValueMap[K]
  ): SettingValueMap[K];
  private processSettingValue<K extends SettingId>(id: K, value?: SettingValueMap[K]) {
    return value === undefined ? this.getDefaultValue(id) : value;
  }

  private getDefaultValue(id: SettingId) {
    const ds = defaultSettings[id];
    return typeof ds === "function" ? ds(this.app) : ds;
  }
  async applyOnStartup() {
    this.app.system.keepAwake.set(await this.get("keepAwake"));
  }

  private afterSetSetting<K extends SettingId>(key: K, value: SettingValueMap[K]) {
    if (key === "anchorDisplay") this.app.controllers.window.updateMainWindowArea();
    else if (key === "startOnBoot") this.app.system.boot.setAutoStart(value as boolean);
    else if (key === "keepAwake") this.app.system.keepAwake.set(value as boolean);
    else if (key === "alwaysOnTop") this.app.controllers.window.applyAlwaysOnTop();
    else if (key === "devMode") this.app.controllers.pluginHmr.setDevMode(value as boolean);
    else if (key === "suppressGlobalKeys") {
      if (value && this.app.state.window.main?.isFocused())
        this.app.globalKey.startSuppress("play");
      else this.app.globalKey.stopSuppress("play");
    }

    if (PlaySyncedSettings.has(key))
      this.app.message.sendToPlay("settings:changed", [key, value] as IpcSettingKeyValueTuple);
  }
}
