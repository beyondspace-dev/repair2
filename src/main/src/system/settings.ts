import { screen } from "electron";
import type { MainApp } from "../app/mainApp";
import { Store } from "./store";
import { SettingFields } from "@shared/setting/settingFields";
import type { SettingValueMap, SettingId } from "@shared/setting/settings";
import { join } from "path";
import { DefaultInternalSettings } from "@shared/setting/internalSettings";

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
    if ((await this.get(key)) === value) return false;

    const ok = await this.app.store
      .set([Store.SETTING_KEY, key], value, false)
      .then(() => true)
      .catch(() => false);
    if (!ok) return false;

    this.afterSetSetting(key, value);
    return true;
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
  private afterSetSetting<K extends SettingId>(key: K, value: SettingValueMap[K]) {
    if (key === "anchorDisplay") this.app.controllers.window.updateMainWindowArea();
    else if (key === "startOnBoot") this.app.system.boot.setAutoStart(value as boolean);
  }
}
