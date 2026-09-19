import { getVariables } from "./variables";
import { getPreloads } from "./resources";
import { WaitingSteps } from "../project/step";
import { getProject, onReady } from "../project";
import { getAllComponents } from "./components";
import type { StandbyEntry } from "../project/nodes/standbyEntry";
import { editor } from "./msg";
import type { MsgRuntimeMonitorChange, MsgRuntimeMonitorTotal } from "@renderer/messagePort";

let changesBuffer: Array<MsgRuntimeMonitorChange> = [];

export function sendChanges(...data: MsgRuntimeMonitorChange): void {
  if (!monitoring) return;

  changesBuffer.push(data);
  readyToFlush();
}

let isReadyToFlush = false;
function readyToFlush() {
  if (isReadyToFlush) return;

  isReadyToFlush = true;
  requestAnimationFrame(flush);
}

function flush() {
  if (!isReadyToFlush || !changesBuffer.length) return;

  editor.send("monitor:info", "update", changesBuffer);
  clear();
}
function clear() {
  changesBuffer = [];
  isReadyToFlush = false;
}

export async function sendTotalInfo() {
  await onReady();

  if (!monitoring) return;
  clear();

  const Data: MsgRuntimeMonitorTotal = {
    variables: new Map(
      getVariables()
        .values()
        .map((v) => [v.id, v.value])
    ),
    preloads: [...getPreloads().keys()],
    steps: WaitingSteps.values().reduce(
      (map: Map<string, number>, { id }) => map.set(id, (map.get(id) ?? 0) + 1),
      new Map()
    ),
    entries: getProject()
      .n.entry.filter((node) => node.d.standbyMode && (node as StandbyEntry).activated)
      .map((node) => node.d.id),
    components: getAllComponents().map((c) => c.realId)
  };
  editor.send("monitor:info", "total", Data);
}

let monitoring: boolean = false;
editor.on("monitor:start", () => {
  monitoring = true;
  sendTotalInfo();
});
editor.on("end", () => {
  monitoring = false;
  clear();
});
