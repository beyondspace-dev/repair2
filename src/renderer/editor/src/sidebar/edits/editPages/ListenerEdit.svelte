<script lang="ts">
  import { ElementListenerTypes } from "../../../lib/translate";
  import { payloadOf, type RecordEditor } from "../../../project/mutator";
  import TypeInput from "../../input/TypeInput.svelte";
  import PluginSelector from "../../input/PluginSelector.svelte";
  import Section from "../layout/Section.svelte";
  import Row from "../layout/Row.svelte";
  import TextField from "../fields/TextField.svelte";
  import TextareaField from "../fields/TextareaField.svelte";
  import NumberField from "../fields/NumberField.svelte";
  import CheckboxField from "../fields/CheckboxField.svelte";

  const { editor }: { editor: RecordEditor<"listeners"> } = $props();
  let data = $derived(editor.value);
</script>

<Section>
  <TypeInput binding={editor} typeName="listener" options={ElementListenerTypes} />
</Section>

{#if data.type === "custom" || data.type === "jsFunction" || data.type === "plugin"}
  <Section title={ElementListenerTypes[data.type]}>
    <TextField
      binding={payloadOf(editor, data.type).field("channel")}
      prefix="채널"
      tooltip="이벤트 채널명"
    />
    {#if data.type === "jsFunction"}
      <Section title="콜백 함수">
        <TextareaField
          binding={payloadOf(editor, "jsFunction").field("scriptData")}
          code
          placeholder={"event 객체 사용 가능\ntrue 반환 시 활성화"}
        />
      </Section>
    {:else if data.type === "plugin"}
      <Section title="플러그인">
        <PluginSelector binding={payloadOf(editor, "plugin").field("plugin")} type="function" />
      </Section>
    {/if}
  </Section>
{:else if data.type === "keyPress"}
  <Section title="감지할 버튼">
    <TextField
      binding={payloadOf(editor, "keyPress").field("key")}
      placeholder="모든 키 감지"
      tooltip="감지할 버튼(콤마로 구분)"
    />
  </Section>
{:else if data.type === "Drag.released"}
  <Section title="인식할 좌표">
    <TextField
      binding={payloadOf(editor, "Drag.released").field("hotspotIndexes")}
      placeholder="항상 발동"
      tooltip="인식할 좌표(0부터 시작, 콤마로 구분)"
    />
  </Section>
{/if}

<Section title="실행">
  <Row>
    <NumberField
      binding={editor.field("repeatCount")}
      fallback={1}
      prefix="반복"
      suffix="회"
      placeholder="1"
      tooltip="발동 반복 횟수"
      min={1}
    />
    {#if data.repeatCount > 1}
      <NumberField
        binding={editor.field("repeatInterval")}
        fallback={0}
        prefix="간격"
        suffix="ms"
        placeholder="제한 없음"
        tooltip="최소 반복 감지 시간(ms), 0 = 시간 제한 없음"
        min={0}
      />
    {/if}
  </Row>
  <Row>
    <CheckboxField binding={editor.field("once")} label="한 번만" tooltip="한 번만 실행" />
    <CheckboxField binding={editor.field("global")} label="전역" tooltip="전역 실행" />
    <CheckboxField binding={editor.field("useCapture")} label="최우선" tooltip="최우선 실행" />
  </Row>
</Section>
