import { powerSaveBlocker } from "electron";

export function createKeepAwake() {
  let blockerId: number | null = null;

  return {
    set(enabled: boolean) {
      if (enabled) {
        if (blockerId !== null && powerSaveBlocker.isStarted(blockerId)) return;
        blockerId = powerSaveBlocker.start("prevent-display-sleep");
      } else if (blockerId !== null) {
        if (powerSaveBlocker.isStarted(blockerId)) powerSaveBlocker.stop(blockerId);
        blockerId = null;
      }
    }
  };
}
