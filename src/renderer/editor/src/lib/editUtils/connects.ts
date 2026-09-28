import { deepForEach, forEachRelationId, KIND } from "@shared/projectData/relation";
import type { Types } from "@shared/projectData/types";
import { getProject } from "../../project/store";
import type { ProjectInstance } from "../../project/project";

/**
 * Nodes that a node leads to: every node referenced by the node itself or by records it owns
 * (e.g. listener outputs inside components created by its steps).
 */
export function getOutsFromNode(
  node: Types.Node,
  project: ProjectInstance = getProject(),
  forEach?: (targetId: string) => unknown
): Set<string> {
  const outs = new Set<string>();

  deepForEach(
    project,
    "nodes",
    node.id,
    ({ type, data }) => {
      forEachRelationId(
        type,
        data as never,
        ({ id, kind }) => {
          if (kind !== KIND.REF) return;
          outs.add(id);
          forEach?.(id);
        },
        { includes: ["nodes"] }
      );
    },
    { onlyOwns: true }
  );
  return outs;
}

type NodeConnects = Record<"ins" | "outs", Map<string, Set<string>>>;
function getAllNodeConnects(project = getProject()): NodeConnects {
  const ins = new Map<string, Set<string>>();
  const outs = new Map<string, Set<string>>();

  project.nodes.values().forEach((node) => {
    outs.set(
      node.id,
      getOutsFromNode(
        node,
        project,
        (id) => ins.get(id)?.add(node.id) || ins.set(id, new Set([node.id]))
      )
    );
  });

  return { ins, outs };
}

function getAllChainedNodeIds(id: string, nodeConnects: NodeConnects): Set<string>;
function getAllChainedNodeIds(
  id: string,
  nodeConnects: NodeConnects,
  result: Set<string>
): Set<string> | undefined;
function getAllChainedNodeIds(
  id: string,
  nodeConnects: NodeConnects,
  result: Set<string> = new Set()
): Set<string> | undefined {
  if (result.has(id)) return;
  result.add(id);

  nodeConnects.ins.get(id)?.forEach((t) => getAllChainedNodeIds(t, nodeConnects, result));
  nodeConnects.outs.get(id)?.forEach((t) => getAllChainedNodeIds(t, nodeConnects, result));

  return result;
}

export function getAllChainedNodes(nodeId: string): Set<string> {
  const ids = getAllChainedNodeIds(nodeId, getAllNodeConnects());
  return ids;
}
