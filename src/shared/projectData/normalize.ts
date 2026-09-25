import { ProjectDefinition } from "./definitions";
import type { Types } from "./types";

export function normalizeProjectData(data: Types.Data): Types.Data {
  return ProjectDefinition.create(data);
}
