import type { GlobalKeyEvent } from "./globalKeyEvent.types";

export const AcceleratorModifiers = ["Ctrl", "Alt", "Shift", "Meta"] as const;
export type AcceleratorModifier = (typeof AcceleratorModifiers)[number];

export type ParsedAccelerator = {
  modifiers: Record<AcceleratorModifier, boolean>;
  key: string;
};

type ModifierFlags = Pick<GlobalKeyEvent, "ctrlKey" | "altKey" | "shiftKey" | "metaKey">;

const ModifierFlagMap = {
  Ctrl: "ctrlKey",
  Alt: "altKey",
  Shift: "shiftKey",
  Meta: "metaKey"
} as const satisfies Record<AcceleratorModifier, keyof ModifierFlags>;

const ModifierKeyMap: Record<string, AcceleratorModifier> = {
  Ctrl: "Ctrl",
  CtrlRight: "Ctrl",
  Alt: "Alt",
  AltRight: "Alt",
  Shift: "Shift",
  ShiftRight: "Shift",
  Meta: "Meta",
  MetaRight: "Meta"
};

const KeyLabels: Record<string, string> = {
  Meta: "Win",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "Esc",
  NumpadMultiply: "Num *",
  NumpadAdd: "Num +",
  NumpadSubtract: "Num -",
  NumpadDecimal: "Num .",
  NumpadDivide: "Num /",
  NumpadEnter: "Num Enter"
};

function isModifierName(value: string): value is AcceleratorModifier {
  return (AcceleratorModifiers as readonly string[]).includes(value);
}

export function isModifierKey(key: string) {
  return Object.hasOwn(ModifierKeyMap, key);
}

export function modifierOfKey(key: string): AcceleratorModifier | null {
  return isModifierKey(key) ? ModifierKeyMap[key] : null;
}

export function modifiersFromKeyEvent(evt: GlobalKeyEvent) {
  return Object.fromEntries(
    AcceleratorModifiers.map((m) => [m, !!evt[ModifierFlagMap[m]]])
  ) as Record<AcceleratorModifier, boolean>;
}

export function hasModifier(accel: ParsedAccelerator) {
  return AcceleratorModifiers.some((m) => accel.modifiers[m]);
}

export function parseAccelerator(accel: string | null | undefined): ParsedAccelerator | null {
  if (!accel) return null;

  const modifiers: Record<AcceleratorModifier, boolean> = {
    Ctrl: false,
    Alt: false,
    Shift: false,
    Meta: false
  };
  let key: string | null = null;

  for (const part of accel.split("+").map((p) => p.trim())) {
    if (!part) return null;
    if (isModifierName(part)) modifiers[part] = true;
    else if (key !== null || isModifierKey(part)) return null;
    else key = part;
  }
  if (!key) return null;

  return { modifiers, key };
}

export function formatAccelerator(accel: ParsedAccelerator) {
  return [...AcceleratorModifiers.filter((m) => accel.modifiers[m]), accel.key].join("+");
}

export function acceleratorFromKeyEvent(evt: GlobalKeyEvent): ParsedAccelerator | null {
  if (!evt.key || isModifierKey(evt.key)) return null;

  return { modifiers: modifiersFromKeyEvent(evt), key: evt.key };
}

export function matchAccelerator(accel: ParsedAccelerator | null, evt: GlobalKeyEvent) {
  if (!accel || evt.key !== accel.key) return false;
  return AcceleratorModifiers.every((m) => !!evt[ModifierFlagMap[m]] === accel.modifiers[m]);
}

export function acceleratorKeyLabels(
  modifiers: Record<AcceleratorModifier, boolean>,
  key: string | null = null
) {
  const keys: string[] = AcceleratorModifiers.filter((m) => modifiers[m]);
  if (key) keys.push(key);
  return keys.map((k) => KeyLabels[k] ?? k);
}
