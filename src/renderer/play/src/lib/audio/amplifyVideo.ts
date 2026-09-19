//thx to https://stackoverflow.com/questions/46264417/videojs-html5-video-js-how-to-boost-volume-above-maximum

import { ctx } from "./_audioContext";

export default function amplifyVideo(vidEl: HTMLVideoElement, gain: number) {
  const result = {
    disconnected: false,
    context: ctx,
    source: ctx.createMediaElementSource(vidEl),
    gain: ctx.createGain(),
    media: vidEl,
    amplify: (gain: number) => {
      result.gain.gain.value = gain;
    },
    getAmpLevel: () => {
      return result.gain.gain.value;
    },
    disconnect() {
      if (this.disconnected) return;
      this.disconnected = true;
      this.source.disconnect();
      this.gain.disconnect();
    }
  };
  result.source.connect(result.gain);
  result.gain.connect(ctx.destination);
  result.amplify(gain);
  return result;
}
export type Amplifier = ReturnType<typeof amplifyVideo>;
