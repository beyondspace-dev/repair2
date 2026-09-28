<script lang="ts">
  import type { FieldBinding } from "../../project/mutator";
  import TextareaField from "../edits/fields/TextareaField.svelte";

  let {
    attributes,
    binding
  }: { attributes: string[]; binding: FieldBinding<Record<string, string>> } = $props();
</script>

{#if attributes.length}
  <div class="attributes">
    {#each attributes as attr}
      <TextareaField binding={binding.field(attr)} prefix={attr} minHeight={0} tooltip={attr} />
    {/each}
  </div>
{/if}

<style>
  .attributes {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-radius: 12px;
    corner-shape: squircle;
    border: solid var(--w-o2) 1px;
  }
</style>
