<script lang="ts" generics="T extends SelectValue">
  import type { ValueBinding } from "../../../project/mutator";
  import { tippy } from "../../../lib/tippy/tippy";
  import { tooltipOptions } from "./tooltip";
  import Select from "../../input/Select.svelte";
  import type { SelectOption, SelectValue } from "../../input/select.types";

  let {
    binding,
    options,
    placeholder = "선택 안함",
    unselectable = false,
    tooltip = null,
    onchange = null
  }: {
    binding: ValueBinding<T | null>;
    /** Option list, or a value → label record. */
    options: readonly SelectOption<T>[] | Readonly<Record<T & string, string>>;
    placeholder?: string;
    unselectable?: boolean;
    tooltip?: string | null;
    onchange?: (() => unknown) | null;
  } = $props();

  let optionList = $derived(
    Array.isArray(options)
      ? (options as readonly SelectOption<T>[])
      : (Object.entries(options) as [T, string][]).map(([value, label]) => ({ value, label }))
  );
</script>

<div class="select-field" use:tippy={tooltipOptions(tooltip)}>
  <Select
    value={binding.value}
    options={optionList}
    {placeholder}
    {unselectable}
    onchange={(value) => {
      binding.set(value);
      onchange?.();
    }}
  />
</div>

<style>
  .select-field {
    min-width: 0;
    width: 100%;
  }
  .select-field :global(.select) {
    width: 100%;
    height: 28px;
    padding-inline: 8px;
    font-size: 14px;
    background-color: var(--w-o1);
  }
</style>
