import type { Types } from "../types";
import { CoordDefinition } from "./coord";
import { custom } from "./core";

/**
 * Its shape depends on `use` (an optional boolean) and it keeps unknown keys, which is too irregular for the DSL,
 * so it is created by a custom descriptor.
 */
export function createDragOption(overrides: Partial<Types.DragOption> = {}): Types.DragOption {
  if (!overrides.use) return { use: false };
  const { hotspots, ...rest } = overrides;

  return {
    use: true,
    returnOnRelease: false,
    returnDuration: 0,
    threshold: 0,
    snapOn: "drag",
    snapDuration: 100,
    moveEasing: "easeOutSine",
    ...rest,
    hotspots: hotspots?.map((hotspot) => CoordDefinition.create(hotspot)) ?? []
  };
}

export const dragOption = () => custom(createDragOption);
