import { app } from "electron";

const AUTOSTART_ARGV = "--autostart";

export function createBoot() {
  const isAutoStarted = process.argv.includes(AUTOSTART_ARGV);

  return {
    setAutoStart(enabled: boolean) {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        args: [AUTOSTART_ARGV],
        name: "Repair2"
      });
    },
    getAutoStartOpt() {
      return app.getLoginItemSettings().openAtLogin;
    },
    isAutoStarted
  };
}
