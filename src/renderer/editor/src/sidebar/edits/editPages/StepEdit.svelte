<script lang="ts">
  import { focusData } from "../../../lib/editUtils/focus";
  import { StepTypes } from "../../../lib/translate";
  import type { RecordEditor } from "../../../project/mutator";
  import TypeInput from "../../input/TypeInput.svelte";
  import Section from "../layout/Section.svelte";
  import TextField from "../fields/TextField.svelte";
  import Audios from "./stepEdits/Audios.svelte";
  import Communications from "./stepEdits/Communications.svelte";
  import Components from "./stepEdits/Components.svelte";
  import Preloads from "./stepEdits/Preloads.svelte";
  import Others from "./stepEdits/Others.svelte";

  const { editor }: { editor: RecordEditor<"steps"> } = $props();
  let data = $derived(editor.value);
  let group = $derived(data.type.split(".")[0]);
  /** Types without payload fields (e.g. `Preload.releaseAll`) get no section. */
  let hasPayload = $derived(!!data.payload && Object.keys(data.payload).length > 0);

  function typeChanged() {
    const current = editor.value;
    if (current.type === "Component.create" && current.payload.componentId)
      focusData("component", current.payload.componentId, [editor.id]);
  }
</script>

<Section>
  <TextField binding={editor.field("title")} placeholder="스텝 이름" tooltip="스텝 이름" />
  <TypeInput binding={editor} typeName="step" options={StepTypes} onchange={typeChanged} />
</Section>

{#if hasPayload}
  {#if group === "Component"}
    <Components {editor} />
  {:else if group === "Audio"}
    <Audios {editor} />
  {:else if group === "Preload"}
    <Preloads {editor} />
  {:else if group === "Communication"}
    <Communications {editor} />
  {:else}
    <Others {editor} />
  {/if}
{/if}
