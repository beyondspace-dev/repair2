import { screen } from "electron";
import type { ProjectConfig } from "@shared/projectData/types";
import type { SettingValueMap } from "@shared/setting/settingFields";

function getFullScreenArea() {
  const screens = screen.getAllDisplays().map((d) => d.bounds);
  const rect = screens.reduce(
    ({ x1, y1, x2, y2 }, { x, y, width, height }) => ({
      x1: Math.min(x1, x),
      y1: Math.min(y1, y),
      x2: Math.max(x2, x + width),
      y2: Math.max(y2, y + height)
    }),
    {
      x1: screens[0].x,
      y1: screens[0].y,
      x2: screens[0].x + screens[0].width,
      y2: screens[0].y + screens[0].height
    }
  );
  return { x: rect.x1, y: rect.y1, width: rect.x2 - rect.x1, height: rect.y2 - rect.y1 };
}

export function getMainScreenArea(anchorDisplayId?: SettingValueMap["anchorDisplay"]) {
  const anchor = anchorDisplayId
    ? screen.getAllDisplays().find((s) => s.id === anchorDisplayId)
    : undefined;
  return (anchor ?? screen.getPrimaryDisplay()).bounds;
}

function getSizeRatio(config: ProjectConfig) {
  const ratio = (config.sizeRatio || "1").toString().split(",").map(Number);
  return ratio.length === 2 ? ratio : [ratio[0], ratio[0]];
}

export function getWindowArea(
  config: ProjectConfig,
  anchorDisplayId: SettingValueMap["anchorDisplay"]
) {
  if (config.screenConfig.type === "fullscreen") return getMainScreenArea(anchorDisplayId);
  if (config.screenConfig.type === "fullMultiScreen") return getFullScreenArea();
  const anchorDisplayAready = getMainScreenArea(anchorDisplayId);
  const sizeRatio = getSizeRatio(config);
  return {
    x: (config.screenConfig.payload?.x ?? 0) + anchorDisplayAready.x,
    y: (config.screenConfig.payload?.y ?? 0) + anchorDisplayAready.y,
    width: (config.width || anchorDisplayAready.width) * sizeRatio[0],
    height: (config.height || anchorDisplayAready.height) * sizeRatio[1]
  };
}
