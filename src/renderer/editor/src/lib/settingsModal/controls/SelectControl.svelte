<script lang="ts">
  import type { SelectField } from "@shared/setting/settings.types";
  import Select from "../../../sidebar/input/Select.svelte";
  import type { SettingControlProps } from "../settingControls";

  let { field, value, onchange }: SettingControlProps<SelectField> = $props();
</script>

<Select
  value={(value ?? null) as string | number | boolean | null}
  options={field.options}
  placeholder={field.placeholder ?? "선택 안 함"}
  unselectable={!!field.nullable}
  onchange={(v) => onchange(v)}
/>
