import { ConfigDefinition, ProjectDefinitions } from "../definitions";
import type { RelationMapType, RelationTree } from "./types";

export * from "./types";

/**
 * Relation tree per record / config, generated from the ProjectData definitions.
 */
export const RelationMap: RelationMapType = {
  config: ConfigDefinition.relations,
  ...Object.fromEntries(
    Object.entries(
      ProjectDefinitions as unknown as Record<string, { relations: RelationTree }>
    ).map(([key, definition]) => [key, definition.relations])
  )
};
