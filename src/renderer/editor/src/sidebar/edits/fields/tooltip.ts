import type { TippyActionParam } from "../../../lib/tippy/tippy";

/** Tippy options of a field's hover tooltip (the full field name, since fields have no label). */
export function tooltipOptions(content: string | null | undefined): TippyActionParam {
  return content ? { content, delay: [500, null] } : undefined;
}
