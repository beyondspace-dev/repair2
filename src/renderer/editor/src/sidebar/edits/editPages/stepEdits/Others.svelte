<script lang="ts">
  import { payloadOf, type RecordEditor } from "../../../../project/mutator";
  import PluginSelector from "../../../input/PluginSelector.svelte";
  import Row from "../../layout/Row.svelte";
  import TextField from "../../fields/TextField.svelte";
  import TextareaField from "../../fields/TextareaField.svelte";
  import NumberField from "../../fields/NumberField.svelte";
  import CheckboxField from "../../fields/CheckboxField.svelte";
  import VariableField from "../../fields/VariableField.svelte";
  import RuntimePluginStep from "./RuntimePluginStep.svelte";
  import Section from "../../layout/Section.svelte";

  const { editor }: { editor: RecordEditor<"steps"> } = $props();
  let type = $derived(editor.value.type);

  const ResetLabels = {
    audios: "음향",
    variables: "변수",
    components: "컴포넌트",
    steps: "스텝",
    preloads: "프리로드",
    entries: "활성 진입점",
    runtimePlugins: "런타임 플러그인"
  } as const;
</script>

{#if type === "delay"}
  <Section title="딜레이">
    <NumberField
      binding={payloadOf(editor, "delay").field("delayMs")}
      suffix="ms"
      placeholder="0"
      min={0}
    />
  </Section>
{:else if type === "Others.customReset"}
  {@const payload = payloadOf(editor, "Others.customReset")}
  <Row columns={2}>
    {#each Object.entries(ResetLabels) as [key, label]}
      <CheckboxField
        binding={payload.field(key as keyof typeof ResetLabels)}
        {label}
        tooltip={`${label} 초기화`}
      />
    {/each}
  </Row>
{:else if type === "Others.eventEmit"}
  {@const payload = payloadOf(editor, "Others.eventEmit")}
  <Section title="채널">
    <TextField binding={payload.field("channel")} />
  </Section>
  <Section title="데이터">
    <TextareaField binding={payload.field("data")} minHeight={0} />
  </Section>
{:else if type === "Others.setVariable"}
  {@const payload = payloadOf(editor, "Others.setVariable")}
  <Section title="변수">
    <VariableField binding={payload.field("variableId")} unselectable={false} />
  </Section>
  <Section title="값">
    <TextField binding={payload.field("value")} placeholder="수정할 값" />
  </Section>
{:else if type === "Others.executePlugin"}
  {@const payload = payloadOf(editor, "Others.executePlugin")}
  <Section title="플러그인">
    <PluginSelector binding={payload.field("plugin")} type="function" canUnselect={false} />
  </Section>
  <CheckboxField binding={payload.field("waitTillEnd")} label="끝날 때까지 기다리기" />
{:else if type === "Others.runtimePluginStep"}
  <RuntimePluginStep {editor} />
{:else if type === "Others.script"}
  <Section title="스크립트">
    <TextareaField
      binding={payloadOf(editor, "Others.script").field("code")}
      code
      minHeight={100}
      placeholder="//Enter JS script"
    />
  </Section>
{:else if type === "Others.log"}
  <Section title="로그 내용">
    <TextareaField binding={payloadOf(editor, "Others.log").field("content")} minHeight={0} />
  </Section>
{/if}
