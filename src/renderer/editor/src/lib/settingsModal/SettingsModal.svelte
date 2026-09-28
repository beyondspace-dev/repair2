<script lang="ts">
  import { SettingFields } from "@shared/setting/settingFields";
  import type { SettingField } from "@shared/setting/settings.types";
  import ModalFrame from "../modal/ModalFrame.svelte";
  import { autofocus } from "../actions/autofocus";
  import Icon from "../../assets/icons/Icon.svelte";
  import SettingItem from "./SettingItem.svelte";
  import {
    closeSettings,
    isRestartPending,
    relaunchApp,
    settingsModal
  } from "./settingsModalState.svelte";

  let query = $state("");
  let relaunching = $state(false);

  function matches(field: SettingField, q: string) {
    if (!q) return true;
    return [field.name, field.description ?? "", field.id].some((t) => t.toLowerCase().includes(q));
  }

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return SettingFields.filter((f) => matches(f, q));
  });

  let restartPending = $derived(isRestartPending());

  async function relaunch() {
    if (relaunching) return;
    relaunching = true;
    await relaunchApp();
    relaunching = false;
  }

  function onSearchKeydown(evt: KeyboardEvent) {
    if (evt.key === "Escape" && query) {
      evt.stopPropagation();
      query = "";
    }
  }

  $effect(() => {
    if (!settingsModal.open) query = "";
  });
</script>

{#if settingsModal.open}
  <ModalFrame title="설정" size="large" closable closeOnBackdrop onclose={closeSettings}>
    {#snippet header()}
      <div class="search-row">
        <div class="search">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="7" cy="7" r="4.75" stroke="#fff" stroke-width="1.3" />
            <path d="M10.5 10.5L14 14" stroke="#fff" stroke-width="1.3" stroke-linecap="round" />
          </svg>
          <input
            type="text"
            placeholder="설정 검색"
            spellcheck="false"
            bind:value={query}
            onkeydown={onSearchKeydown}
            use:autofocus={true}
          />
          {#if query}
            <span class="count">{filtered.length}개 설정</span>
            <button class="clear" onclick={() => (query = "")} aria-label="검색어 지우기">
              <Icon icon="close" color="#fff" lineWidth={1} size={10} />
            </button>
          {/if}
        </div>
      </div>
    {/snippet}

    {#if restartPending}
      <div class="restart-banner">
        <Icon icon="warn" color="#fff" size={16} lineWidth={1} />
        <span class="message">변경한 설정 중 일부는 앱을 재시작해야 적용됩니다.</span>
        <button class="relaunch" disabled={relaunching} onclick={relaunch}>
          {relaunching ? "재시작하는 중…" : "지금 재시작"}
        </button>
      </div>
    {/if}

    <div class="list scroll">
      <div class="inner">
        {#each filtered as field (field.id)}
          <SettingItem {field} {query} />
        {:else}
          <div class="empty">"{query.trim()}"에 해당하는 설정이 없습니다.</div>
        {/each}
      </div>
    </div>
  </ModalFrame>
{/if}

<style>
  .search-row {
    padding: 0 15px 15px 15px;
  }
  .search {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 0 6px 0 12px;
    background-color: var(--w-o2);
    border: solid transparent 1px;
    border-radius: 12px;
    corner-shape: squircle;
    box-sizing: border-box;
  }
  .search:hover {
    border-color: var(--w-o2);
  }
  .search:focus-within {
    border-color: var(--blue-bright);
  }
  .search > svg {
    opacity: 0.6;
  }
  .search input {
    flex: 1 1 auto;
    min-width: 0;
    background: none;
    border: none !important;
    padding: 7px 0;
  }
  .count {
    flex: 0 0 auto;
    font-size: 13px;
    opacity: 0.6;
  }
  .clear {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    corner-shape: squircle;
    cursor: pointer;
    opacity: 0.6;
  }
  .clear:hover {
    opacity: 1;
    background-color: var(--w-o1);
  }
  .restart-banner {
    flex: 0 0 auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 8px 15px 8px 20px;
    background-color: rgba(225, 83, 0, 0.25);
    border-bottom: solid rgba(225, 83, 0, 0.5) 1px;
    font-size: 14px;
  }
  .restart-banner .message {
    flex: 1 1 auto;
  }
  .relaunch {
    flex: 0 0 auto;
    padding: 3px 10px;
    font-size: 14px;
    color: #fff;
    border-radius: 10px;
    corner-shape: squircle;
    background-color: var(--orange);
    cursor: pointer;
  }
  .relaunch:hover {
    filter: brightness(1.1);
  }
  .relaunch:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .list {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden scroll;
  }
  .inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 15px 15px 60px 15px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-sizing: border-box;
  }
  .empty {
    padding: 40px 0;
    text-align: center;
    opacity: 0.6;
  }
</style>
