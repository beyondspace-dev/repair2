import { SettingFields, type SettingFieldId } from "@shared/setting/settingFields";
import { registerMenuAction } from "../../titleBar/menuActions";
import { settings } from "../settings.svelte";
import { ipc } from "../ipc";
import { showToast } from "../toast/toast.svelte";

export const settingsModal = $state({ open: false });

let launchValues: Partial<Record<SettingFieldId, unknown>> | null = null;

function captureLaunchValues() {
  if (launchValues) return;
  launchValues = Object.fromEntries(
    SettingFields.filter((f) => "requireRestart" in f && f.requireRestart).map((f) => [
      f.id,
      $state.snapshot(settings[f.id])
    ])
  );
}

export function openSettings() {
  captureLaunchValues();
  settingsModal.open = true;
}

export function closeSettings() {
  settingsModal.open = false;
}

export function toggleSettings() {
  if (settingsModal.open) closeSettings();
  else openSettings();
}

export function isRestartPending() {
  if (!launchValues) return false;
  return (Object.keys(launchValues) as SettingFieldId[]).some(
    (id) => !Object.is(settings[id], launchValues![id])
  );
}

export async function relaunchApp() {
  const ok = await ipc.invoke("app:relaunch").catch(() => false);
  if (!ok)
    showToast({
      type: "error",
      title: "재시작하지 못했습니다.",
      content: "프로젝트를 저장하지 못해 재시작을 취소했습니다."
    });
}

registerMenuAction("file:settings", toggleSettings);
