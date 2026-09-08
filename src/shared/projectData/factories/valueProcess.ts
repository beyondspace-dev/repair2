import { nanoid } from "nanoid";
import type { Types } from "../types";
import { createTypePayloadFactory } from "./typePayloadFactory";

export const createValueProcess = createTypePayloadFactory<Types.ValueProcess>("valueProcess")({
  id: () => nanoid(),
  type: ""
});
