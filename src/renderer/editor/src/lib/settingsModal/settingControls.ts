import type { Component } from "svelte";
import type { SettingField } from "@shared/setting/settings.types";
import CheckboxControl from "./controls/CheckboxControl.svelte";
import TextControl from "./controls/TextControl.svelte";
import NumberControl from "./controls/NumberControl.svelte";
import SelectControl from "./controls/SelectControl.svelte";
import DisplayControl from "./controls/DisplayControl.svelte";
import SerialPathControl from "./controls/SerialPathControl.svelte";
import AudioOutputControl from "./controls/AudioOutputControl.svelte";
import AcceleratorControl from "./controls/AcceleratorControl.svelte";

export type SettingControlProps<F extends SettingField = SettingField> = {
  field: F;
  value: unknown;
  onchange: (value: unknown) => unknown;
};

type SettingControlMap = {
  [T in SettingField["type"]]: Component<SettingControlProps<Extract<SettingField, { type: T }>>>;
};

export const SettingControls = {
  string: TextControl,
  url: TextControl,
  number: NumberControl,
  select: SelectControl,
  checkbox: CheckboxControl,
  accelerator: AcceleratorControl,
  display: DisplayControl,
  serialPath: SerialPathControl,
  audioOutput: AudioOutputControl
} as const satisfies SettingControlMap;
