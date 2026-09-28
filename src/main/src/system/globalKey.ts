import {
  uIOhook,
  UiohookKey,
  type UiohookKeyboardEvent,
  type UiohookKeyboardSuppressShortcut
} from "@fainthit/uiohook-napi-suppress";
import type { GlobalKeyEvent, GlobalKey as GlobalKeyString } from "@shared/globalKeyEvent.types";

type KeyEventName = "keydown" | "keyup";
type GlobalKeyListener = (type: KeyEventName, evt: GlobalKeyEvent) => void;
type SuppressReason = "play" | "capture";

const SuppressingKeys: UiohookKeyboardSuppressShortcut[] = [
  { metaKey: true },
  { keycode: UiohookKey.F4, altKey: true },
  { keycode: UiohookKey.Tab, altKey: true },
  { keycode: UiohookKey.Space, altKey: true },
  { keycode: UiohookKey.Escape, ctrlKey: true, shiftKey: true },
  { keycode: UiohookKey.Escape, ctrlKey: true },
  { keycode: UiohookKey.Escape, altKey: true }
];

export class GlobalKey {
  #globalKeycodeMap: Map<number, GlobalKeyString> = new Map(
    Object.entries(UiohookKey).map((_) => [_[1], _[0] as GlobalKeyString])
  );
  #suppressId = uIOhook.registerSuppress(SuppressingKeys);
  #globalKeyListener: GlobalKeyListener | null = null;
  #suppressReasons = new Set<SuppressReason>();

  get isSuppressing() {
    return this.#suppressReasons.size > 0;
  }
  get isCapturing() {
    return this.#suppressReasons.has("capture");
  }

  constructor() {
    uIOhook.toggleSuppress(this.#suppressId, false);

    uIOhook.addListener("keydown", (evt: UiohookKeyboardEvent) =>
      this.callGlobalKeyListener("keydown", evt)
    );
    uIOhook.addListener("keyup", (evt: UiohookKeyboardEvent) =>
      this.callGlobalKeyListener("keyup", evt)
    );

    uIOhook.start();
  }
  startSuppress(reason: SuppressReason) {
    const wasSuppressing = this.isSuppressing;
    this.#suppressReasons.add(reason);
    if (!wasSuppressing) uIOhook.toggleSuppress(this.#suppressId, true);
  }
  stopSuppress(reason: SuppressReason) {
    if (!this.#suppressReasons.delete(reason) || this.isSuppressing) return;
    uIOhook.toggleSuppress(this.#suppressId, false);
  }
  setGlobalKeyListener(callback: GlobalKeyListener) {
    this.#globalKeyListener = callback;
  }
  callGlobalKeyListener(type: KeyEventName, evt: UiohookKeyboardEvent) {
    if (!this.#globalKeyListener) return;

    const e: GlobalKeyEvent = {
      ...evt,
      key: this.#globalKeycodeMap.get(evt.keycode)
    };
    this.#globalKeyListener(type, e);
  }
}
