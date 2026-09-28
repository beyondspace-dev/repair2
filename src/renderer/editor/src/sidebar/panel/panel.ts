import type { Action } from "svelte/action";
import Grabber from "../../lib/grabber";

import "./panel.css";

interface ViewportOffset {
  x: number;
  y: number;
  width: number;
  height: number;
}

let resizeHandler: (viewportOffset: ViewportOffset, first: boolean) => unknown | null;
export function setPanelResizeHandler(
  handler: (viewportOffset: ViewportOffset, first: boolean) => unknown
) {
  resizeHandler = handler;
  onResize();
}

type DIR = "left" | "top" | "right" | "bottom";
export const Panels: Partial<Record<DIR, number>> = {};

function onResize(first = false) {
  resizeHandler(
    {
      x: Panels.left ?? 0,
      y: Panels.top ?? 0,
      width: -(Panels.left ?? 0) - (Panels.right ?? 0),
      height: -(Panels.top ?? 0) - (Panels.bottom ?? 0)
    },
    first
  );
}

function setSize(dir: DIR, v: number, first = false) {
  Panels[dir] = v;
  onResize(first);
}

interface PanelParams {
  startSize: number;
  handleSize?: number;
  minSize?: number;
  dir?: DIR;
  collapsed?: boolean;
  collapsedSize?: number;
  onResize?(size: number): unknown;
}

export const panel: Action<HTMLElement, PanelParams> = (node, params) => {
  const { startSize, handleSize = 6, minSize = 0, dir = "left", onResize: afterResized } = params;
  if (dir in Panels) {
    throw new Error(`${dir} panel is already registered`);
  }
  let collapsed = params.collapsed ?? false;
  let collapsedSize = params.collapsedSize ?? 0;

  node.classList.add("panel");

  const isX = dir === "left" || dir === "right";
  const isNegative = dir === "right" || dir === "bottom";
  const sizeKey = isX ? "width" : "height";

  const resizer = document.createElement("div");
  resizer.classList.add("panel-resizer", dir);
  resizer.style.setProperty("--handle-size", `${handleSize}px`);
  node.append(resizer);

  let displaySize: number = startSize;
  let expandedSize: number = startSize;

  function setDisplaySize(size: number, clamp = true) {
    displaySize = size;
    const sizeStr = `${clamp ? Math.max(minSize, size) : size}px`;
    node.style[sizeKey] = sizeStr;
    node.style.setProperty("--panel-size", sizeStr);
  }
  function set(size: number, first = false) {
    Panels[dir] = size;
    setSize(dir, size, first);
  }
  function applySize(first = false) {
    resizer.style.display = collapsed ? "none" : "";
    const size = collapsed ? collapsedSize : expandedSize;
    set(size, first);
    setDisplaySize(size, !collapsed);
  }
  applySize(true);

  const grabber = new Grabber({
    container: resizer,
    optimizedOnMoved: true,
    onMoveStart: () => {
      setDisplaySize(expandedSize);
      set(0);
    },
    onMoved: (m) => {
      setDisplaySize(displaySize + m[isX ? "dx" : "dy"] * (isNegative ? -1 : 1));
    },
    onMoveEnd: () => {
      expandedSize = Math.max(minSize, displaySize);
      set(expandedSize);
      afterResized?.(expandedSize);
      setDisplaySize(expandedSize);
    },
    inNodeSpace: false
  });

  return {
    update: (next) => {
      const nextCollapsed = next.collapsed ?? false;
      const nextCollapsedSize = next.collapsedSize ?? 0;
      if (nextCollapsed === collapsed && nextCollapsedSize === collapsedSize) return;
      collapsed = nextCollapsed;
      collapsedSize = nextCollapsedSize;
      applySize();
    },
    destroy: () => {
      grabber.destroy();
      delete Panels[dir];
      onResize();
    }
  };
};
