<script lang="ts">
  import type { ValueBinding } from "../../../project/mutator";
  import { getProject } from "../../../project/store";
  import SelectField from "./SelectField.svelte";

  let {
    binding,
    unselectable = true,
    placeholder = "변수 할당 없음",
    tooltip = null
  }: {
    binding: ValueBinding<string | null>;
    unselectable?: boolean;
    placeholder?: string;
    tooltip?: string | null;
  } = $props();

  let options = $derived(
    getProject()
      .variables.values()
      .map((v) => [v.id, v.name ?? "이름 없는 변수"] as const)
      .toArray()
  );
</script>

<SelectField {binding} {options} {unselectable} {placeholder} {tooltip} />
