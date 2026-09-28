import { ProjectDefinition } from "@shared/projectData/definitions";
import type { StoredProjectData } from "@shared/projectData/types";

export function makeEmptyProjectData(appVersion: string): StoredProjectData {
  return ProjectDefinition.create({ appVersion });
}
