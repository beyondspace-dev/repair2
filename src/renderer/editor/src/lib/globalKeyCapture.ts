import type { GlobalKeyEvent } from "@shared/globalKeyEvent.types";
import { ipc } from "./ipc";

type CaptureHandler = (type: "keydown" | "keyup", evt: GlobalKeyEvent) => unknown;

let activeHandler: CaptureHandler | null = null;

ipc.on("global-key-event", (_evt, type, evt) => {
  activeHandler?.(type, evt);
});

export function startGlobalKeyCapture(handler: CaptureHandler) {
  activeHandler = handler;
  ipc.send("global-key:capture", true);

  return () => {
    if (activeHandler !== handler) return;
    activeHandler = null;
    ipc.send("global-key:capture", false);
  };
}
