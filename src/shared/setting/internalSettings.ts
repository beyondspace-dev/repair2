type INTERNAL_SETTING<T> = { __internal_setting_type: T };

function i<T>(d: T | (() => T)) {
  return d as unknown as INTERNAL_SETTING<T>;
}

export interface WindowState {
  bounds: { x: number; y: number; width: number; height: number };
  maximized: boolean;
}

const InternalSettingData = {
  sidebarWidth: i(350),
  editPanelWidth: i(350),
  showLogs: i(false),
  logHeight: i(200),
  editorWindowState: i<WindowState | null>(null)
} as const;

type IS = typeof InternalSettingData;

export type InternalSettings = {
  [k in keyof IS]: IS[k] extends INTERNAL_SETTING<infer U> ? U : IS[k];
};

export const DefaultInternalSettings = InternalSettingData as unknown as InternalSettings;
