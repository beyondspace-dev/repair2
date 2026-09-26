import { CoordDefinition } from "./coord";
import { custom, type InferData } from "./core";

type Coord = InferData<typeof CoordDefinition>;

export type EnabledDragOption = {
  use: true;
  returnOnRelease: boolean;
  returnDuration: number;
  hotspots: Coord[];
  threshold: number;
  snapOn: "never" | "drag" | "release";
  snapDuration: number;
  moveEasing: string;
};

export type DragOption = EnabledDragOption | { use?: false };

/**
 * Its shape depends on `use` (an optional boolean) and it keeps unknown keys, which is too irregular for the DSL,
 * so it is created by a custom descriptor.
 */
export function createDragOption(overrides: Partial<DragOption> = {}): DragOption {
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
