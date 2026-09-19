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

export const panel: Action<
  HTMLElement,
  {
    startSize: number;
    handleSize?: number;
    minSize?: number;
    dir?: DIR;
    onResize?(size: number): unknown;
  }
> = (node, { startSize, handleSize = 6, minSize = 0, dir = "left", onResize: afterResized }) => {
  if (dir in Panels) {
    throw new Error(`${dir} panel is already registered`);
  }

  node.classList.add("panel");

  const isX = dir === "left" || dir === "right";
  const isNegative = dir === "right" || dir === "bottom";
  const sizeKey = isX ? "width" : "height";

  const resizer = document.createElement("div");
  resizer.classList.add("panel-resizer", dir);
  resizer.style.setProperty("--handle-size", `${handleSize}px`);
  node.append(resizer);

  let displaySize: number = startSize;

  function setDisplaySize(size: number = Panels[dir]!) {
    displaySize = size;
    const sizeStr = `${Math.max(minSize, size)}px`;
    node.style[sizeKey] = sizeStr;
    node.style.setProperty("--panel-size", sizeStr);
  }
  function set(size: number, first = false) {
    Panels[dir] = size;
    setSize(dir, size, first);
  }
  set(startSize, true);
  setDisplaySize();

  const grabber = new Grabber({
    container: resizer,
    optimizedOnMoved: true,
    onMoveStart: () => {
      setDisplaySize();
      set(0);
    },
    onMoved: (m) => {
      setDisplaySize(displaySize + m[isX ? "dx" : "dy"] * (isNegative ? -1 : 1));
    },
    onMoveEnd: () => {
      const v = Math.max(minSize, displaySize);
      set(v);
      afterResized?.(v);
      setDisplaySize();
    },
    inNodeSpace: false
  });

  return {
    destroy: () => {
      grabber.destroy();
      delete Panels[dir];
      onResize();
    }
  };
};
