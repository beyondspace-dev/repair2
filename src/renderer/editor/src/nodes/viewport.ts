import { get, writable } from "svelte/store";
import { closeContextMenu } from "../lib/editUtils/contextMenu/contextUtils";
import { getProject } from "../project/store";
import FrameUpdater from "../lib/frameUpdater";
import type { Types } from "@shared/projectData/types";
import { getAllNodeBounds } from "./geometry";
import { registerMenuAction } from "../titleBar/menuActions";
import type { Action } from "svelte/action";
import { getTitleBarRect, TITLEBAR_HEIGHT_OFFSET } from "../titleBar/index.svelte";
import { setPanelResizeHandler } from "../sidebar/panel/panel";
import { registerLoad } from "../lib/editorLoad";

export const rInfo = {
  ratio: 0,
  RW: 0,
  RH: 0
};

let screenRect: {
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
};

let viewportOffset = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

export interface ScreenData {
  width: number;
  height: number;
  x: number;
  y: number;
  pixelWidth: number;
  pixelHeight: number;
}
export const viewport = {
  screen: writable<ScreenData>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    pixelWidth: 0,
    pixelHeight: 0
  }),
  size: writable(0),
  pos: writable({ x: 0, y: 0 })
};

let afterFirstLoad: (() => void) | null = registerLoad();
const fu = new FrameUpdater(() => {
  calcRatio();
  if (afterFirstLoad) {
    afterFirstLoad();
    afterFirstLoad = null;
  }
});

export function recalcViewport() {
  fu.draw();
}

const observer = new ResizeObserver((entries) => {
  if (!entries.length) return;

  const rect = entries[0].contentRect;
  const deviceRect = entries[0].devicePixelContentBoxSize?.[0];

  screenRect = {
    width: rect.width,
    height: rect.height,
    pixelWidth: deviceRect?.inlineSize ?? rect.width,
    pixelHeight: deviceRect?.blockSize ?? rect.height
  };

  fu.draw();
});
export const observingViewport: Action = (target) => {
  observer.observe(target);
};

setPanelResizeHandler((o) => {
  const dw = (o.width - viewportOffset.width) / 2 + (o.x - viewportOffset.x);
  const dh = (o.height - viewportOffset.height) / 2 + (o.y - viewportOffset.y);
  viewportOffset = o;
  moveViewport(dw, dh);
  fu.draw();
});

function calcRatio() {
  if (!screenRect) return;

  const viewportWidth = screenRect.width + viewportOffset.width;
  const viewportHeight = screenRect.height + viewportOffset.height;
  const pwr = screenRect.pixelWidth / screenRect.width;
  const phr = screenRect.pixelHeight / screenRect.height;
  const titlebarRect = getTitleBarRect();
  const screenObj = {
    width: viewportWidth,
    height: viewportHeight,
    x: viewportOffset.x,
    y: titlebarRect.height + titlebarRect.y + TITLEBAR_HEIGHT_OFFSET + viewportOffset.y,
    pixelWidth: viewportWidth * pwr,
    pixelHeight: viewportHeight * phr
  };

  rInfo.ratio = Math.pow(10, get(viewport.size));
  rInfo.RW = screenObj.width / rInfo.ratio;
  rInfo.RH = screenObj.height / rInfo.ratio;
  viewport.screen.set(screenObj);

  document.body.style.setProperty("--viewport-ratio", `${rInfo.ratio}`);
}

function posFromAnchor(len: number, anchor: number, pos: number) {
  return pos - anchor + len / 2;
}
function removeAnchor(len: number, anchor: number, pos: number) {
  return pos + anchor - len / 2;
}

export function posFromViewport(x: number, y: number, vpPos = get(viewport.pos)) {
  return {
    x: posFromAnchor(rInfo.RW, vpPos.x, x) * rInfo.ratio,
    y: posFromAnchor(rInfo.RH, vpPos.y, y) * rInfo.ratio
  };
}
export function getOriginalPos(x: number, y: number) {
  const vpPos = get(viewport.pos);
  const screen = get(viewport.screen);
  return {
    x: removeAnchor(rInfo.RW, vpPos.x, (x - screen.x) / rInfo.ratio),
    y: removeAnchor(rInfo.RH, vpPos.y, (y - screen.y) / rInfo.ratio)
  };
}

export function moveViewport(dx: number, dy: number) {
  if (Number.isNaN(dx) || Number.isNaN(dy)) return;
  viewport.pos.update((p) => ({
    x: (p.x += dx / rInfo.ratio),
    y: (p.y += dy / rInfo.ratio)
  }));
}

const sizeLimit = [-0.7, 0.5];
export function setViewportSize(size: number, considerLimit = true) {
  if (Number.isNaN(size)) return;
  const newSize = considerLimit ? Math.min(Math.max(size, sizeLimit[0]), sizeLimit[1]) : size;

  closeContextMenu();
  viewport.size.set(newSize);
  calcRatio();
}

export function isBoundOutViewport(x1: number, y1: number, x2: number, y2: number) {
  const screen = get(viewport.screen);

  return screen
    ? ((x1 < 0 && x2 < 0) || (x1 > screen.width && x2 > screen.width)) &&
        ((y1 < 0 && y2 < 0) || (y1 > screen.height && y2 > screen.height))
    : true;
}

export function resizeViewport(step: number, mousePos: { x: number; y: number } | null = null) {
  if (Number.isNaN(step)) return;

  const prevSize = get(viewport.size);
  const newSize = get(viewport.size) + step * 0.1;

  if (mousePos && prevSize !== newSize) {
    const realPos = getOriginalPos(mousePos.x, mousePos.y);

    setViewportSize(newSize, true);

    const newRealPos = getOriginalPos(mousePos.x, mousePos.y);

    viewport.pos.update((p) => ({
      x: p.x + (realPos.x - newRealPos.x),
      y: p.y + (realPos.y - newRealPos.y)
    }));
  } else {
    setViewportSize(newSize, true);
  }
}

const padding = 100;
export function fitViewportToNodes(nodes: Map<string, Types.Node>) {
  if (!nodes || nodes.size === 0) {
    setViewportSize(0);
    viewport.pos.set({ x: 0, y: 0 });
    return;
  }

  const bounds = getAllNodeBounds();

  // Add padding
  bounds.x1 -= padding;
  bounds.y1 -= padding;
  bounds.x2 += padding;
  bounds.y2 += padding;

  // Calculate center position
  const centerX = (bounds.x1 + bounds.x2) / 2;
  const centerY = (bounds.y1 + bounds.y2) / 2;

  // Calculate required scale
  const width = bounds.x2 - bounds.x1;
  const height = bounds.y2 - bounds.y1;
  const screenRect = get(viewport.screen);
  const scaleX = Math.log10(screenRect.width / width);
  const scaleY = Math.log10(screenRect.height / height);
  const scale = Math.min(scaleX, scaleY, sizeLimit[1]);

  // Apply new viewport settings
  setViewportSize(scale, false);
  viewport.pos.set({ x: centerX, y: centerY });
}

export function getViewportCenter() {
  const vp = get(viewport.pos);
  return { x: vp.x, y: vp.y };
}

function zoom(step: number) {
  const scr = get(viewport.screen);
  const center = { x: scr.width / 2 + scr.x, y: scr.height / 2 + scr.y };
  resizeViewport(step, center);
}

registerMenuAction("view:zoom-in", () => zoom(1));
registerMenuAction("view:zoom-out", () => zoom(-1));
registerMenuAction("view:zoom-fit", () => fitViewportToNodes(getProject().nodes));
