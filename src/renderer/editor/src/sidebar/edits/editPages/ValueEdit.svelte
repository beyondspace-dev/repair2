<script lang="ts">
  import { BaseValueTypes } from "../../../lib/translate";
  import { derivedBinding, type RecordEditor } from "../../../project/mutator";
  import Section from "../layout/Section.svelte";
  import SelectField from "../fields/SelectField.svelte";
  import TextField from "../fields/TextField.svelte";
  import VariableField from "../fields/VariableField.svelte";

  const { editor }: { editor: RecordEditor<"values"> } = $props();
  let data = $derived(editor.value);

  /** Changing the base type drops the value of the previous one. */
  const baseType = derivedBinding(
    () => data.baseType as keyof typeof BaseValueTypes,
    (baseType) => {
      if (baseType) editor.set({ ...data, baseType, baseValue: null });
    }
  );
</script>

<Section title="기본값">
  <SelectField binding={baseType} options={BaseValueTypes} tooltip="기본값 종류" />
  {#if data.baseType === "string"}
    <TextField
      binding={editor.field("baseValue")}
      placeholder="기본값 직접 입력"
      tooltip="기본값"
    />
  {:else if data.baseType === "variable"}
    <VariableField binding={editor.field("baseValue")} unselectable={false} tooltip="변수 할당" />
  {/if}
</Section>
