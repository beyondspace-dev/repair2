<script lang="ts">
  import { ScreenConfigTypes } from "../../../lib/translate";
  import { Factories } from "../../../project/factories";
  import { getMutator } from "../../../project/store";
  import { payloadOf, type ConfigEditor, type FieldBinding } from "../../../project/mutator";
  import TypeInput from "../../input/TypeInput.svelte";
  import PluginSelector from "../../input/PluginSelector.svelte";
  import Section from "../layout/Section.svelte";
  import ListSection from "../layout/ListSection.svelte";
  import Row from "../layout/Row.svelte";
  import TextField from "../fields/TextField.svelte";
  import TextareaField from "../fields/TextareaField.svelte";
  import NumberField from "../fields/NumberField.svelte";
  import CheckboxField from "../fields/CheckboxField.svelte";
  import SizeField from "../fields/SizeField.svelte";

  const { editor }: { editor: ConfigEditor } = $props();
  let data = $derived(editor.value);
  let runtimePlugins = $derived(editor.field("runtimePlugins"));
  /** Stored as JSON (number or "w,h" string) but always edited as text. */
  let sizeRatio = $derived(editor.field("sizeRatio") as FieldBinding<string | null>);

  function addRuntimePlugin() {
    getMutator().transaction(() => {
      runtimePlugins.splice(data.runtimePlugins.length, 0, Factories.pluginPointer());
    });
  }

  function removeRuntimePlugin(index: number, id: string) {
    const mutator = getMutator();
    mutator.transaction(() => {
      runtimePlugins.splice(index, 1);
      mutator.delete("pluginPointers", id);
    });
  }
</script>

<Section>
  <TextField binding={editor.field("title")} placeholder="프로젝트 이름" tooltip="프로젝트 이름" />
</Section>

<Section title="화면">
  <SizeField width={editor.field("width")} height={editor.field("height")} />
  <TextField
    binding={sizeRatio}
    prefix="확대"
    placeholder="가로비율,세로비율"
    tooltip="확대 비율"
  />
  <TypeInput
    binding={editor.field("screenConfig")}
    typeName="screenConfig"
    options={ScreenConfigTypes}
  />
  {#if data.screenConfig.type === "windowMode"}
    {@const windowMode = payloadOf(editor.field("screenConfig"), "windowMode")}
    <Row>
      <NumberField binding={windowMode.field("x")} prefix="X" suffix="px" tooltip="창 X좌표" />
      <NumberField binding={windowMode.field("y")} prefix="Y" suffix="px" tooltip="창 Y좌표" />
    </Row>
  {/if}
</Section>

<Section title="스타일">
  <TextareaField
    binding={editor.field("filter")}
    code
    placeholder="CSS filter"
    tooltip="화면 필터"
  />
  <TextareaField binding={editor.field("style")} code placeholder="CSS 코드" tooltip="CSS style" />
  <CheckboxField binding={editor.field("transparent")} label="투명한 창" />
</Section>

<ListSection
  title="런타임 플러그인"
  binding={runtimePlugins}
  create={addRuntimePlugin}
  remove={removeRuntimePlugin}
>
  {#snippet item(plugin)}
    <PluginSelector binding={plugin} type="runtime" canUnselect={false} />
  {/snippet}
</ListSection>
