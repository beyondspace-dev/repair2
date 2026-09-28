import { ipc } from "../ipc";
import { reportLog } from "../logClient";

type SinkAudioContext = AudioContext & { setSinkId(sinkId: string): Promise<void> };

const VIRTUAL_DEVICE_IDS = new Set(["default", "communications"]);

let targetLabel: string | null = null;
let sinkId = "";
let missingReported: string | null = null;

const contexts = new Set<WeakRef<SinkAudioContext>>();
const mediaElements = new Set<WeakRef<HTMLMediaElement>>();
const trackedMedia = new WeakSet<HTMLMediaElement>();

function forEachAlive<T extends object>(refs: Set<WeakRef<T>>, fn: (target: T) => unknown) {
  for (const ref of refs) {
    const target = ref.deref();
    if (target) fn(target);
    else refs.delete(ref);
  }
}

function applyToContext(context: SinkAudioContext) {
  if (context.state === "closed") return;
  context.setSinkId(sinkId).catch(() => {});
}

function applyToMedia(el: HTMLMediaElement) {
  if (!trackedMedia.has(el)) {
    trackedMedia.add(el);
    mediaElements.add(new WeakRef(el));
  }
  if (el.sinkId !== sinkId) el.setSinkId(sinkId).catch(() => {});
}

const NativeAudioContext = window.AudioContext;
class TrackedAudioContext extends NativeAudioContext {
  constructor(options?: AudioContextOptions) {
    super(
      sinkId && !(options && "sinkId" in options)
        ? ({ ...options, sinkId } as AudioContextOptions)
        : options
    );
    contexts.add(new WeakRef(this as unknown as SinkAudioContext));
  }
}
window.AudioContext = TrackedAudioContext;

const nativePlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
  applyToMedia(this);
  return nativePlay.call(this);
};

document.addEventListener(
  "play",
  (evt) => {
    if (evt.target instanceof HTMLMediaElement) applyToMedia(evt.target);
  },
  true
);

async function resolveSinkId(label: string | null) {
  if (!label) return "";

  const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
  const device = devices.find(
    (d) => d.kind === "audiooutput" && !VIRTUAL_DEVICE_IDS.has(d.deviceId) && d.label === label
  );
  if (device) {
    missingReported = null;
    return device.deviceId;
  }

  if (missingReported !== label) {
    missingReported = label;
    reportLog({
      level: "warning",
      source: "play",
      type: "audio-output-missing",
      content: [`오디오 출력 장치 "${label}"을(를) 찾을 수 없어 시스템 기본 장치를 사용합니다.`]
    });
  }
  return "";
}

async function update() {
  const label = targetLabel;
  const next = await resolveSinkId(label);
  if (label !== targetLabel || next === sinkId) return;

  sinkId = next;
  forEachAlive(contexts, applyToContext);
  forEachAlive(mediaElements, applyToMedia);
}

function setTargetLabel(label: string | null) {
  targetLabel = label;
  update();
}

ipc
  .invoke("settings:get", "audioOutputHardware")
  .then((value) => setTargetLabel(typeof value === "string" ? value : null))
  .catch(() => {});

ipc.on("settings:changed", (_evt, [key, value]) => {
  if (key === "audioOutputHardware") setTargetLabel(value);
});

navigator.mediaDevices.addEventListener("devicechange", update);
