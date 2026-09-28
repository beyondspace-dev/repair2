<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    columns = null,
    children
  }: {
    /**
     * Omitted: one row of equal columns. A number: wraps into that many equal columns.
     * A string: explicit `grid-template-columns`.
     */
    columns?: number | string | null;
    children: Snippet;
  } = $props();

  let template = $derived(
    typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns
  );
</script>

<div class={["row", template && "fixed"]} style:grid-template-columns={template}>
  {@render children()}
</div>

<style>
  .row {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 6px;
    align-items: center;
  }
  .row.fixed {
    grid-auto-flow: row;
  }
</style>
