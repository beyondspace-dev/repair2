import type { Prettify } from "../utils.types";
import type { InternalSettings } from "./internalSettings";
import type { SettingFieldId, SettingFieldValueMap } from "./settingFields";

export type SettingValueMap = Prettify<InternalSettings & SettingFieldValueMap>;

export type SettingId = keyof InternalSettings | SettingFieldId;
