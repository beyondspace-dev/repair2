<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import type { ArrayFieldBinding, Binding } from "../../../project/mutator";
  import IconButton from "./IconButton.svelte";
  import Section from "./Section.svelte";

  let {
    title,
    binding,
    newItem = null,
    create = null,
    remove = null,
    min = 0,
    max = Infinity,
    item
  }: {
    title: string;
    binding: ArrayFieldBinding<T>;
    /** Value appended by the + button. */
    newItem?: (() => T) | null;
    /** Replaces the default append (e.g. when the item owns another record). */
    create?: (() => unknown) | null;
    /** Replaces the default splice (e.g. to delete an owned record too). */
    remove?: ((index: number, value: T) => unknown) | null;
    min?: number;
    max?: number;
    item: Snippet<[binding: Binding<T>, index: number]>;
  } = $props();

  let items = $derived(binding.value);

  function add() {
    if (create) create();
    else binding.splice(items.length, 0, (newItem ? newItem() : null) as T);
  }

  function removeAt(index: number) {
    if (remove) remove(index, items[index]);
    else binding.splice(index, 1);
  }
</script>

<Section {title}>
  {#snippet actions()}
    {#if items.length < max}
      <IconButton icon="plus" tooltip="추가" onclick={add} />
    {/if}
  {/snippet}
  {#each items as _, index}
    <div class="list-item">
      <div class="content">{@render item(binding.at(index), index)}</div>
      {#if index >= min}
        <IconButton icon="close" size={10} tooltip="삭제" onclick={() => removeAt(index)} />
      {/if}
    </div>
  {/each}
</Section>

<style>
  .list-item {
    display: flex;
    flex-direction: row;
    align-items: start;
    gap: 2px;
  }
  .list-item .content {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .list-item > :global(.icon-button) {
    margin-top: 2px;
  }
</style>
