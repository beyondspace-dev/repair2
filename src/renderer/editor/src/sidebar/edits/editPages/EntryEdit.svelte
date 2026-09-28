<script lang="ts">
  import type { Types } from "@shared/projectData/types";
  import { EntryTypes } from "../../../lib/translate";
  import { getMutator } from "../../../project/store";
  import { derivedBinding, payloadOf, type RecordEditor } from "../../../project/mutator";
  import TypeInput from "../../input/TypeInput.svelte";
  import Section from "../layout/Section.svelte";
  import Row from "../layout/Row.svelte";
  import TextField from "../fields/TextField.svelte";
  import NumberField from "../fields/NumberField.svelte";
  import CheckboxField from "../fields/CheckboxField.svelte";

  const { editor }: { editor: RecordEditor<"nodes", Types.Entry> } = $props();
  let data = $derived(editor.value);

  const alwaysWaiting = derivedBinding(
    () => !data.standbyMode,
    (alwaysWaiting) => {
      const standbyMode = !alwaysWaiting;
      getMutator().transaction(() => {
        editor.field("standbyMode").set(standbyMode);
        if (!standbyMode) getMutator().disconnectOutputsTo(editor.id);
      });
    }
  );
</script>

<Section>
  <TextField binding={editor.field("alias")} placeholder="진입점 이름" tooltip="진입점 이름" />
  <TypeInput binding={editor} typeName="entry" options={EntryTypes} />
  <CheckboxField binding={alwaysWaiting} label="항상 대기" />
</Section>

{#if data.type === "event"}
  <Section title="이벤트">
    <TextField
      binding={payloadOf(editor, "event").field("channel")}
      prefix="채널"
      tooltip="이벤트 채널"
    />
  </Section>
{:else if data.type === "shortcut"}
  {@const payload = payloadOf(editor, "shortcut")}
  <Section title="단축키">
    <TextField
      binding={payload.field("key")}
      placeholder="감지할 키보드 버튼"
      tooltip="감지할 키보드 버튼"
    />
    <Row>
      <CheckboxField binding={payload.field("ctrlKey")} label="Ctrl" tooltip="Ctrl 눌러야 감지" />
      <CheckboxField binding={payload.field("altKey")} label="Alt" tooltip="Alt 눌러야 감지" />
      <CheckboxField
        binding={payload.field("shiftKey")}
        label="Shift"
        tooltip="Shift 눌러야 감지"
      />
      <CheckboxField binding={payload.field("metaKey")} label="Win" tooltip="Win 눌러야 감지" />
    </Row>
    <NumberField
      binding={payload.field("pressingTime")}
      prefix="누름"
      suffix="초"
      placeholder="0"
      tooltip="감지 시간(초)"
    />
  </Section>
{:else if data.type === "Communication.Socket.ondata"}
  {@const payload = payloadOf(editor, "Communication.Socket.ondata")}
  <Section title="수신">
    <TextField binding={payload.field("channel")} prefix="채널" tooltip="수신 채널" />
    <TextField
      binding={payload.field("data")}
      prefix="데이터"
      placeholder="항상 작동"
      tooltip="일치 시 작동할 데이터"
    />
  </Section>
{:else if data.type === "Communication.serialData"}
  <Section title="수신">
    <TextField
      binding={payloadOf(editor, "Communication.serialData").field("whenDataIs")}
      prefix="데이터"
      placeholder="모든 데이터 수신"
      tooltip="수신 데이터"
    />
  </Section>
{:else if data.type === "Communication.Mqtt.ondata"}
  {@const payload = payloadOf(editor, "Communication.Mqtt.ondata")}
  <Section title="수신">
    <TextField binding={payload.field("topic")} prefix="토픽" tooltip="토픽" />
    <TextField
      binding={payload.field("data")}
      prefix="데이터"
      placeholder="항상 작동"
      tooltip="일치 시 작동할 데이터"
    />
  </Section>
{/if}
