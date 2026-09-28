<script lang="ts" module>
  const DEPTH = Symbol("section-depth");
</script>

<script lang="ts">
  import { getContext, setContext, type Snippet } from "svelte";

  let {
    title = null,
    actions = null,
    children
  }: {
    /** Category name. Without one the section is an untitled header block. */
    title?: string | null;
    /** Controls placed at the right of the title (add button, toggle, …). */
    actions?: Snippet | null;
    children?: Snippet;
  } = $props();

  const depth: number = getContext(DEPTH) ?? 0;
  setContext(DEPTH, depth + 1);
</script>

<section class={["section", depth > 0 && "nested"]}>
  {#if title || actions}
    <div class="header">
      <span class="title">{title}</span>
      {#if actions}
        <div class="actions">{@render actions()}</div>
      {/if}
    </div>
  {/if}
  {#if children}
    <div class="body">{@render children()}</div>
  {/if}
</section>

<style>
  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-inline: -14px;
    padding: 0 14px 16px;
  }
  .section:not(.nested):not(:first-child) {
    border-top: solid var(--w-o6) 1px;
    margin-top: 10px;
    padding-top: 10px;
  }
  .section.nested {
    margin-inline: 0;
    padding: 4px 0 0;
    gap: 6px;
  }
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
  }
  .title {
    font-size: 13px;
    font-weight: 600;
  }
  .nested .title {
    font-size: 12px;
    font-weight: 500;
    color: var(--w-o6);
  }
  .actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
</style>
