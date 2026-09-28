<script lang="ts">
  import type { CheckboxField } from "@shared/setting/settings.types";
  import Checkbox from "../../../sidebar/input/Checkbox.svelte";
  import type { SettingControlProps } from "../settingControls";

  let { value, onchange }: SettingControlProps<CheckboxField> = $props();
</script>

<button
  type="button"
  class="checkbox-control"
  role="checkbox"
  aria-checked={!!value}
  onclick={() => onchange(!value)}
>
  <Checkbox value={!!value} />
</button>

<style>
  .checkbox-control {
    padding: 0;
    cursor: pointer;
    flex: 0 0 auto;
    border-radius: 10px;
    corner-shape: squircle;
  }
  .checkbox-control:focus-visible {
    outline: solid 1px var(--blue-bright);
  }
</style>
