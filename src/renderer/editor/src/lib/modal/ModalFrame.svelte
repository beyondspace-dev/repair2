<script lang="ts">
  import type { Snippet } from "svelte";
  import { onDestroy } from "svelte";
  import Icon from "../../assets/icons/Icon.svelte";
  import { pushModalLayer } from "./modalStack";

  let {
    title = null,
    size = "auto",
    closable = false,
    closeOnBackdrop = false,
    onclose,
    onkeydown,
    header,
    footer,
    children
  }: {
    title?: string | null;
    size?: "auto" | "large";
    closable?: boolean;
    closeOnBackdrop?: boolean;
    onclose?: () => unknown;
    onkeydown?: (evt: KeyboardEvent) => unknown;
    header?: Snippet;
    footer?: Snippet;
    children: Snippet;
  } = $props();

  const layer = pushModalLayer();
  onDestroy(layer.remove);

  function onWindowKeydown(evt: KeyboardEvent) {
    if (!layer.isTop()) return;
    if (evt.key === "Escape" && onclose) {
      evt.preventDefault();
      onclose();
      return;
    }
    onkeydown?.(evt);
  }

  function onBackdropPointerdown(evt: PointerEvent) {
    if (closeOnBackdrop && evt.target === evt.currentTarget) onclose?.();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="modal-wrapper" role="presentation" onpointerdown={onBackdropPointerdown}>
  <div class={["modal", size]} role="dialog" aria-modal="true" aria-label={title ?? undefined}>
    {#if title || closable || header}
      <div class="header">
        {#if title || closable}
          <div class="title-row">
            <div class="title">{title ?? ""}</div>
            {#if closable}
              <button class="close" onclick={() => onclose?.()} aria-label="닫기">
                <Icon icon="close" color="#fff" lineWidth={1} size={14} />
              </button>
            {/if}
          </div>
        {/if}
        {@render header?.()}
      </div>
    {/if}
    {@render children()}
    {#if footer}
      <div class="footer">
        {@render footer()}
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-wrapper {
    z-index: var(--modal-z);
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: var(--b-o4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    color: #fff;
    background-color: #232323;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    corner-shape: squircle;
    overflow: hidden;
  }
  .modal.auto {
    min-width: 300px;
    max-width: calc(100% - 100px);
    max-height: calc(100% - 100px);
  }
  .modal.large {
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    max-width: 1100px;
  }
  .header {
    flex: 0 0 auto;
    border-bottom: solid var(--w-o8) 1px;
  }
  .large .header {
    border-bottom-color: var(--w-o2);
  }
  .title-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 15px;
  }
  .large .title-row {
    padding: 15px 15px 12px 20px;
  }
  .title {
    flex: 1 1 auto;
  }
  .large .title {
    font-size: 20px;
    font-weight: 600;
  }
  .close {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    corner-shape: squircle;
    cursor: pointer;
    opacity: 0.6;
  }
  .close:hover {
    opacity: 1;
    background-color: var(--w-o1);
  }
  .footer {
    border-top: solid rgba(255, 255, 255, 0.4) 1px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: end;
    gap: 10px;
    flex: 0 0 auto;
    padding: 10px 15px;
  }
</style>
