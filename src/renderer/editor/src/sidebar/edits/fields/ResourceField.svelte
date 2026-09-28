<script lang="ts">
  import type { ValueBinding } from "../../../project/mutator";
  import ResourceSelector from "../../input/ResourceSelector.svelte";

  let {
    binding,
    type = null,
    onremove = null
  }: {
    binding: ValueBinding<string | null>;
    /** Resource file type to list; all resources when omitted. */
    type?: "image" | "video" | "audio" | null;
    /** Shows a remove button on the selector (used by list items). */
    onremove?: (() => unknown) | null;
  } = $props();
</script>

<ResourceSelector
  resourceId={binding.value}
  {type}
  onchange={(id: string | null) => binding.set(id)}
  removable={!!onremove}
  {onremove}
/>
