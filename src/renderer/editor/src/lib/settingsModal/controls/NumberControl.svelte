<script lang="ts">
  import type { NumberField } from "@shared/setting/settings.types";
  import type { SettingControlProps } from "../settingControls";

  let { field, value, onchange }: SettingControlProps<NumberField> = $props();

  let draft = $state("");
  let focused = $state(false);
  let error = $state<string | null>(null);

  let committed = $derived(value == null ? "" : String(value));

  $effect(() => {
    const next = committed;
    if (!focused) draft = next;
  });

  function parse(text: string): { value: number | null; error: string | null } {
    if (text === "")
      return field.nullable
        ? { value: null, error: null }
        : { value: null, error: "값을 입력해야 합니다." };

    const num = Number(text);
    if (!Number.isFinite(num)) return { value: null, error: "숫자를 입력해야 합니다." };
    if (field.min !== undefined && num < field.min)
      return { value: null, error: `${field.min} 이상이어야 합니다.` };
    if (field.max !== undefined && num > field.max)
      return { value: null, error: `${field.max} 이하여야 합니다.` };
    return { value: num, error: null };
  }

  function commit() {
    const result = parse(String(draft ?? "").trim());
    error = result.error;
    if (error) return;
    if (!Object.is(result.value, value)) onchange(result.value);
  }

  function onkeydown(evt: KeyboardEvent) {
    if (evt.key === "Enter") {
      evt.stopPropagation();
      commit();
    } else if (evt.key === "Escape" && draft !== committed) {
      evt.stopPropagation();
      draft = committed;
      error = null;
    }
  }
</script>

<div class="number-control">
  <input
    type="text"
    inputmode="decimal"
    class:invalid={!!error}
    bind:value={draft}
    placeholder={field.placeholder === undefined ? undefined : String(field.placeholder)}
    onfocus={() => (focused = true)}
    onblur={() => {
      focused = false;
      commit();
    }}
    oninput={() => (error = null)}
    {onkeydown}
  />
  {#if error}
    <div class="error">{error}</div>
  {/if}
</div>

<style>
  .number-control {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  input {
    width: 100%;
  }
  input.invalid {
    border-color: var(--orange) !important;
  }
  .error {
    font-size: 13px;
    color: var(--orange);
    padding-left: 3px;
  }
</style>
