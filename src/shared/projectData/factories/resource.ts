import { nanoid } from "nanoid";
import type { Types } from "../types";
import { createFactory } from "./factory";

export const createResource = createFactory<Types.Resource>({
  id: () => nanoid(),
  src: null,
  alias: null
});
