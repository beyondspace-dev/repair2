<script lang="ts">
  import { onDestroy } from "svelte";
  import type { AcceleratorField } from "@shared/setting/settings.types";
  import type { GlobalKeyEvent } from "@shared/globalKeyEvent.types";
  import {
    acceleratorFromKeyEvent,
    acceleratorKeyLabels,
    formatAccelerator,
    hasModifier,
    modifierOfKey,
    modifiersFromKeyEvent,
    parseAccelerator,
    type AcceleratorModifier
  } from "@shared/accelerator";
  import { startGlobalKeyCapture } from "../../globalKeyCapture";
  import type { SettingControlProps } from "../settingControls";

  let { field, value, onchange }: SettingControlProps<AcceleratorField> = $props();

  let el = $state<HTMLDivElement>();
  let capturing = $state(false);
  let error = $state<string | null>(null);
  let pressing = $state<Record<AcceleratorModifier, boolean> | null>(null);
  let stopCapture: (() => unknown) | null = null;

  let current = $derived(typeof value === "string" ? parseAccelerator(value) : null);
  let labels = $derived.by(() => {
    if (capturing) return pressing ? acceleratorKeyLabels(pressing) : [];
    return current ? acceleratorKeyLabels(current.modifiers, current.key) : [];
  });

  function finish() {
    el?.blur();
  }

  function onGlobalKey(type: "keydown" | "keyup", evt: GlobalKeyEvent) {
    if (!evt.key) return;

    const modifier = modifierOfKey(evt.key);
    if (modifier) {
      pressing = { ...modifiersFromKeyEvent(evt), [modifier]: type === "keydown" };
      return;
    }
    if (type !== "keydown") return;

    const accel = acceleratorFromKeyEvent(evt);
    if (!accel) return;

    const bare = !hasModifier(accel);
    if (bare && accel.key === "Escape") {
      finish();
      return;
    }
    if (bare && field.nullable && (accel.key === "Backspace" || accel.key === "Delete")) {
      if (value !== null) onchange(null);
      finish();
      return;
    }
    if (bare && field.requireModifier) {
      error = "Ctrl, Alt, Shift, Win 중 하나 이상과 함께 눌러야 합니다.";
      return;
    }

    const next = formatAccelerator(accel);
    if (next !== value) onchange(next);
    finish();
  }

  function onfocus() {
    capturing = true;
    error = null;
    pressing = null;
    stopCapture?.();
    stopCapture = startGlobalKeyCapture(onGlobalKey);
  }

  function onblur() {
    capturing = false;
    pressing = null;
    stopCapture?.();
    stopCapture = null;
  }

  function onkeydown(evt: KeyboardEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  onDestroy(() => stopCapture?.());
</script>

<svelte:window onblur={finish} />

<div class="accelerator-control">
  <div
    bind:this={el}
    class={["accelerator", capturing && "capturing", !!error && "invalid"]}
    role="textbox"
    tabindex="0"
    aria-label={field.name}
    {onfocus}
    {onblur}
    {onkeydown}
  >
    {#if labels.length}
      <div class="keys">
        {#each labels as label, i}
          {#if i > 0}<span class="plus">+</span>{/if}
          <kbd>{label}</kbd>
        {/each}
      </div>
    {:else if capturing}
      <span class="placeholder">단축키를 누르세요</span>
    {:else}
      <span class="placeholder">단축키 없음</span>
    {/if}
  </div>
  {#if capturing}
    <div class="hint">
      Esc: 취소{field.nullable ? " · Backspace: 지우기" : ""}
    </div>
  {/if}
  {#if error}
    <div class="error">{error}</div>
  {/if}
</div>

<style>
  .accelerator-control {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .accelerator {
    min-height: 30px;
    padding: 2px 6px;
    display: flex;
    flex-direction: row;
    align-items: center;
    box-sizing: border-box;
    border: solid transparent 1px;
    background-color: var(--w-o2);
    border-radius: 10px;
    corner-shape: squircle;
    cursor: pointer;
  }
  .accelerator:hover {
    border-color: var(--w-o2);
  }
  .accelerator.capturing {
    border-color: var(--blue-bright) !important;
    cursor: default;
  }
  .accelerator.invalid {
    border-color: var(--orange) !important;
  }
  .keys {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }
  kbd {
    font-family: inherit;
    font-size: 13px;
    padding: 1px 7px;
    border-radius: 6px;
    background-color: var(--w-o1);
    border: solid var(--w-o2) 1px;
    border-bottom-width: 2px;
  }
  .plus {
    font-size: 12px;
    opacity: 0.6;
  }
  .placeholder {
    font-size: 14px;
    opacity: 0.6;
  }
  .hint {
    font-size: 12px;
    opacity: 0.6;
    padding-left: 3px;
  }
  .error {
    font-size: 13px;
    color: var(--orange);
    padding-left: 3px;
  }
</style>
