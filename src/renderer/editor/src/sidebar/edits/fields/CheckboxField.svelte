<script lang="ts">
  import type { ValueBinding } from "../../../project/mutator";
  import { tippy } from "../../../lib/tippy/tippy";
  import { tooltipOptions } from "./tooltip";
  import Checkbox from "../../input/Checkbox.svelte";

  let {
    binding,
    label,
    tooltip = null,
    onchange = null
  }: {
    binding: ValueBinding<boolean>;
    label: string;
    tooltip?: string | null;
    onchange?: (() => unknown) | null;
  } = $props();

  function toggle() {
    binding.set(!binding.value);
    onchange?.();
  }
</script>

<button type="button" class="checkbox-field" onclick={toggle} use:tippy={tooltipOptions(tooltip)}>
  <Checkbox value={binding.value} />
  <span>{label}</span>
</button>

<style>
  .checkbox-field {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-width: 0;
    height: 28px;
    padding: 0 4px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    text-align: left;
  }
  .checkbox-field span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.9;
  }
  .checkbox-field:hover span {
    opacity: 1;
  }
</style>
