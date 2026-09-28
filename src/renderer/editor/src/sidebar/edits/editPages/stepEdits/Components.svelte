<script lang="ts">
  import { ComponentModifyTypes } from "../../../../lib/translate";
  import {
    derivedBinding,
    payloadOf,
    type FieldBinding,
    type RecordEditor
  } from "../../../../project/mutator";
  import TextField from "../../fields/TextField.svelte";
  import TextareaField from "../../fields/TextareaField.svelte";
  import NumberField from "../../fields/NumberField.svelte";
  import SelectField from "../../fields/SelectField.svelte";
  import CheckboxField from "../../fields/CheckboxField.svelte";
  import Section from "../../layout/Section.svelte";

  const { editor }: { editor: RecordEditor<"steps"> } = $props();
  let data = $derived(editor.value);

  const recreate = derivedBinding(
    () => payloadOf(editor, "Component.create").field("recreate").value === "allow",
    (allow) =>
      payloadOf(editor, "Component.create")
        .field("recreate")
        .set(allow ? "allow" : "ignore")
  );

  let modify = $derived(payloadOf(editor, "Component.modify"));
  /** Changing the modified property drops the value set for the previous one. */
  const modifyKey = derivedBinding(
    () => modify.field("modifyKey").value as keyof typeof ComponentModifyTypes | null,
    (key) => modify.set({ ...modify.value, modifyKey: key, modifyValue: null })
  );
  let modifyValue = $derived(modify.field("modifyValue"));
  /** `modifyValue` is JSON whose shape follows `modifyKey`. */
  let modifyNumber = $derived(modifyValue as FieldBinding<number | null>);
  let modifyText = $derived(modifyValue as FieldBinding<string | null>);
  const modifyFlag = derivedBinding(
    () => !!modifyValue.value,
    (value) => modifyValue.set(value)
  );
</script>

{#if data.type === "Component.create"}
  <CheckboxField
    binding={recreate}
    label="재생성 허용"
    tooltip="이미 존재하는 컴포넌트인 경우 기존 컴포넌트를 삭제하고 새로 생성합니다."
  />
{:else if data.type === "Component.remove"}
  {@const payload = payloadOf(editor, "Component.remove")}
  <Section title="컴포넌트 삭제">
    <TextField
      binding={payload.field("componentAlias")}
      placeholder="삭제할 컴포넌트 이름"
      tooltip="삭제할 컴포넌트 이름"
    />
    <CheckboxField binding={payload.field("ignoreUnbreakable")} label="보호된 컴포넌트여도 제거" />
  </Section>
{:else if data.type === "Component.modify"}
  <Section title="대상 컴포넌트">
    <TextField
      binding={modify.field("componentAlias")}
      placeholder="수정할 컴포넌트 이름"
      tooltip="수정할 컴포넌트 이름"
    />
  </Section>
  <Section title="속성">
    <SelectField
      binding={modifyKey}
      options={ComponentModifyTypes}
      placeholder="수정할 속성"
      tooltip="수정할 속성"
    />
    {#if data.payload.modifyKey === "visible" || data.payload.modifyKey === "unbreakable"}
      <CheckboxField binding={modifyFlag} label={ComponentModifyTypes[data.payload.modifyKey]} />
    {:else if data.payload.modifyKey === "zIndex"}
      <NumberField
        binding={modifyNumber}
        prefix="Z"
        placeholder="값이 클수록 앞에 보임"
        tooltip="Z축 위치"
      />
    {:else if data.payload.modifyKey === "style"}
      <TextareaField binding={modifyText} code placeholder="CSS 코드" tooltip="CSS 코드" />
    {/if}
  </Section>
{:else if data.type === "Component.clear"}
  <CheckboxField
    binding={payloadOf(editor, "Component.clear").field("ignoreUnbreakable")}
    label="보호된 컴포넌트까지 제거"
  />
{/if}
