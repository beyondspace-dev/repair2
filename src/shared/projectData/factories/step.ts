import { nanoid } from "nanoid";
import type { Types } from "../types";
import { createTypePayloadFactory } from "./typePayloadFactory";

export const createStep = createTypePayloadFactory<Types.Step>("step")({
  id: () => nanoid(),
  title: null,
  type: ""
});
