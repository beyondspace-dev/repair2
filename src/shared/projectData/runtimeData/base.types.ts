import type { RecordKey, RecordValue } from "../../constants";
import type { Override } from "../../utils.types";
import type { Data } from "../v2Data.types";

export type RuntimeProjectData = Override<Data, { [K in RecordKey]: Map<string, RecordValue<K>> }>;
