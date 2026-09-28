<script lang="ts">
  import { payloadOf, type RecordEditor } from "../../../../project/mutator";
  import ListSection from "../../layout/ListSection.svelte";
  import ResourceField from "../../fields/ResourceField.svelte";

  const { editor }: { editor: RecordEditor<"steps"> } = $props();
  let type = $derived(editor.value.type);
</script>

{#if type === "Preload.add" || type === "Preload.release"}
  <ListSection title="자원 목록" binding={payloadOf(editor, type).field("resourceArr")}>
    {#snippet item(resource)}
      <ResourceField binding={resource} />
    {/snippet}
  </ListSection>
{/if}
