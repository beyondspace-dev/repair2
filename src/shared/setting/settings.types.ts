type SettingFieldBase = {
  id: string;
  name: string;
  description?: string;
  requireRestart?: boolean;
  nullable?: boolean;
};

type StringField = SettingFieldBase & {
  type: "string";
  default?: string;
  maxLength?: number;
  placeholder?: string;
};
type NumberField = SettingFieldBase & {
  type: "number";
  default?: number;
  min?: number;
  max?: number;
  placeholder?: string | number;
};
type SelectField = SettingFieldBase & {
  type: "select";
  default: string;
  options: [string | number | boolean, string][];
  placeholder?: string;
};
type CheckboxField = SettingFieldBase & {
  type: "checkbox";
  default?: boolean;
};
type SpecialFieldTypeMap = {
  display: number;
  serialPath: string;
  url: string;
};
type SpecialField = SettingFieldBase & {
  type: keyof SpecialFieldTypeMap;
};

type SettingField = StringField | NumberField | SelectField | CheckboxField | SpecialField;

export type {
  SettingField,
  StringField,
  NumberField,
  SelectField,
  CheckboxField,
  SpecialField,
  SpecialFieldTypeMap
};
