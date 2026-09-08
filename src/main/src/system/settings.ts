import { screen } from "electron";
import type { MainApp } from "../app/mainApp";
import { logger } from "../logs/logger";
import { Store } from "./store";
import { SettingFields, type SettingId, type SettingValueMap } from "@shared/setting/settingFields";
import { join } from "path";

const SettingFieldMap = new Map(SettingFields.map((s) => [s.id, s]));

export class Settings {
  constructor(private readonly app: MainApp) {}

  async getAll(forceUpdate: boolean = false) {
    const settings = await this.app.store.get(Store.SETTING_KEY, forceUpdate, false);
    return Object.fromEntries(
      SettingFields.map((f) => {
        return [f.id, this.processSettingValue(f.id, settings[f.id])];
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

  private getDefaultValue<K extends SettingId>(id: K): SettingValueMap[K];
  private getDefaultValue(id: SettingId) {
    const field = SettingFieldMap.get(id);
    if (!field) {
      logger.error("Unknown setting field:", id);
      return;
    }

    if ("default" in field) return field.default;
    if (id === "projectPath")
      return join(
        this.app.system.app.getPath("userData"),
        this.app.isDev ? "dev_project" : "project"
      );
    if (id === "anchorDisplay") return screen.getPrimaryDisplay().id;
    else return null;
  }
  private afterSetSetting<K extends SettingId>(key: K, value: SettingValueMap[K]) {
    if (key === "anchorDisplay") this.app.controllers.window.updateMainWindowArea();
    else if (key === "startOnBoot") this.app.system.boot.setAutoStart(value as boolean);
  }
}
