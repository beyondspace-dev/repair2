<script lang="ts">
  import type { Types } from "@shared/projectData/types";
  import { ComparisonOperatorTypes } from "../../../lib/translate";
  import { derivedBinding, type RecordEditor } from "../../../project/mutator";
  import Section from "../layout/Section.svelte";
  import TextField from "../fields/TextField.svelte";
  import TextareaField from "../fields/TextareaField.svelte";
  import SelectField from "../fields/SelectField.svelte";
  import CheckboxField from "../fields/CheckboxField.svelte";

  const { editor }: { editor: RecordEditor<"nodes", Types.Branch> } = $props();
  let data = $derived(editor.value);

  /** Changing the operator drops the script of the previous one. */
  const operator = derivedBinding(
    () => data.operator,
    (operator: Types.Branch["operator"] | null) => {
      if (operator) editor.set({ ...data, operator, scriptData: null });
    }
  );
</script>

<Section>
  <TextField binding={editor.field("alias")} placeholder="분기점 이름" tooltip="분기점 이름" />
</Section>

<Section title="비교">
  <SelectField binding={operator} options={ComparisonOperatorTypes} tooltip="비교 연산자" />
  {#if data.operator === "jsFunction"}
    <Section title="콜백 함수">
      <TextareaField
        binding={editor.field("scriptData")}
        code
        placeholder="return valueA === valueB"
      />
    </Section>
  {/if}
</Section>

<Section title="발동 이후">
  <CheckboxField binding={editor.field("disableAfterTrue")} label="'참' 발동 이후 비활성화" />
  <CheckboxField binding={editor.field("disableAfterFalse")} label="'거짓' 발동 이후 비활성화" />
</Section>
