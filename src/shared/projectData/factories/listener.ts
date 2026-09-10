import { nanoid } from "nanoid";
import type { Types } from "../types";
import { createTypePayloadFactory } from "./typePayloadFactory";

export const createListener = createTypePayloadFactory<Types.Listener>("listener")({
  id: () => nanoid(),
  repeatCount: 1,
  repeatInterval: 0,
  once: false,
  global: false,
  useCapture: false,
  output: null,
  type: "custom"
});
