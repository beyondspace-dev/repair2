import { nanoid } from "nanoid";
import type { Types } from "../types";
import { createFactory } from "./factory";

export const createVariable = createFactory<Types.Variable>({
  id: () => nanoid(),
  name: null,
  defaultValue: null
});
