<script lang="ts">
  import type { Component } from "svelte";
  import { nanoid } from "nanoid";
  import type { SettingFieldId } from "@shared/setting/settingFields";
  import type { SettingField } from "@shared/setting/settings.types";
  import type { IpcSettingKeyValueTuple } from "@shared/ipc.types";
  import Icon from "../../assets/icons/Icon.svelte";
  import Menu from "../menu/Menu.svelte";
  import type { MenuItem } from "../menu/menu.types";
  import { isSettingModified, resetSetting, setSetting, settings } from "../settings.svelte";
  import { SettingControls, type SettingControlProps } from "./settingControls";

  let { field, query = "" }: { field: SettingField & { id: SettingFieldId }; query?: string } =
    $props();

  let Control = $derived(SettingControls[field.type] as unknown as Component<SettingControlProps>);
  let value = $derived(settings[field.id]);
  let modified = $derived(isSettingModified(field.id));
  let isCheckbox = $derived(field.type === "checkbox");

  function onchange(next: unknown) {
    const [key, value] = [field.id, next] as IpcSettingKeyValueTuple;
    setSetting(key, value);
  }

  function highlight(text: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [{ text, match: false }];

    const result: { text: string; match: boolean }[] = [];
    const lower = text.toLowerCase();
    let idx = 0;
    while (idx < text.length) {
      const found = lower.indexOf(q, idx);
      if (found === -1) {
        result.push({ text: text.slice(idx), match: false });
        break;
      }
      if (found > idx) result.push({ text: text.slice(idx, found), match: false });
      result.push({ text: text.slice(found, found + q.length), match: true });
      idx = found + q.length;
    }
    return result;
  }

  const anchorName = `--setting-more-${nanoid()}`;
  let moreBtn = $state<HTMLButtonElement>();
  let menuOpen = $state(false);

  let menuItems = $derived<MenuItem[]>([
    {
      label: "기본값으로 초기화",
      disabled: !modified,
      activate: () => resetSetting(field.id)
    },
    {
      label: "설정 ID 복사",
      activate: () => navigator.clipboard.writeText(field.id)
    }
  ]);
</script>

{#snippet text(content: string)}
  {#each highlight(content) as part}
    {#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}
  {/each}
{/snippet}

<div class={["setting-item", modified && "modified", menuOpen && "menu-open"]}>
  <div class="head">
    <span class="name">{@render text(field.name)}</span>
    {#if field.requireRestart}
      <span class="badge">재시작 필요</span>
    {/if}
    <button
      bind:this={moreBtn}
      class="more"
      style={`anchor-name: ${anchorName};`}
      onclick={() => (menuOpen = !menuOpen)}
      onblur={() => (menuOpen = false)}
      aria-label="더 보기"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
    >
      <Icon icon="ellipsis" color="#fff" size={14} lineWidth={1} />
    </button>
  </div>
  {#if isCheckbox}
    <div class="checkbox-row">
      <Control {field} {value} {onchange} />
      {#if field.description}
        <button type="button" class="description" onclick={() => onchange(!value)}>
          {@render text(field.description)}
        </button>
      {/if}
    </div>
  {:else}
    {#if field.description}
      <div class="description">{@render text(field.description)}</div>
    {/if}
    <div class="control">
      <Control {field} {value} {onchange} />
    </div>
  {/if}
  <div class="id">{@render text(field.id)}</div>
</div>
{#if menuOpen}
  <Menu
    items={menuItems}
    parents={moreBtn ? [moreBtn] : []}
    {anchorName}
    style="menu"
    minWidth="160px"
    collapse={() => (menuOpen = false)}
  />
{/if}

<style>
  .setting-item {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px 12px 18px;
    border-radius: 14px;
    corner-shape: squircle;
  }
  .setting-item:hover,
  .setting-item.menu-open,
  .setting-item:focus-within {
    background-color: var(--w-o1);
  }
  .setting-item.modified::before {
    content: "";
    position: absolute;
    left: 6px;
    top: 14px;
    bottom: 14px;
    width: 2px;
    border-radius: 1px;
    background-color: var(--blue-bright);
  }
  .head {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-height: 24px;
  }
  .name {
    font-size: 16px;
    font-weight: 600;
  }
  .badge {
    font-size: 12px;
    padding: 1px 7px;
    border-radius: 8px;
    corner-shape: squircle;
    background-color: var(--w-o1);
    border: solid var(--w-o2) 1px;
    opacity: 0.8;
  }
  .more {
    margin-left: auto;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    corner-shape: squircle;
    cursor: pointer;
    opacity: 0;
  }
  .setting-item:hover .more,
  .setting-item.menu-open .more,
  .more:focus-visible {
    opacity: 0.6;
  }
  .more:hover,
  .setting-item.menu-open .more {
    opacity: 1 !important;
    background-color: var(--w-o1);
  }
  .description {
    font-size: 14px;
    line-height: 1.45em;
    opacity: 0.7;
    white-space: pre-wrap;
    word-break: keep-all;
  }
  .checkbox-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
  }
  .checkbox-row .description {
    padding: 0;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }
  .control {
    max-width: 420px;
    margin-top: 2px;
  }
  .id {
    font-family: "Consolas";
    font-size: 12px;
    opacity: 0.35;
  }
  mark {
    background-color: rgba(78, 134, 255, 0.45);
    color: inherit;
    border-radius: 3px;
  }
</style>
