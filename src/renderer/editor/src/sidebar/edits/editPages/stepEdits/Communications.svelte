<script lang="ts">
  import { payloadOf, type RecordEditor } from "../../../../project/mutator";
  import ListSection from "../../layout/ListSection.svelte";
  import TextField from "../../fields/TextField.svelte";
  import TextareaField from "../../fields/TextareaField.svelte";
  import NumberField from "../../fields/NumberField.svelte";
  import Section from "../../layout/Section.svelte";

  const { editor }: { editor: RecordEditor<"steps"> } = $props();
  let type = $derived(editor.value.type);
</script>

{#if type === "Communication.Serial.open"}
  {@const payload = payloadOf(editor, type)}
  <Section title="시리얼 통신">
    <TextField
      binding={payload.field("portAlias")}
      prefix="키워드"
      placeholder="기기 이름에 포함 시 연결 (선택)"
      tooltip="연결 키워드(선택)"
    />
    <TextField
      binding={payload.field("port")}
      prefix="포트"
      placeholder="키워드 없을 시 연결"
      tooltip="포트 번호"
    />
    <NumberField
      binding={payload.field("baudRate")}
      prefix="속도"
      placeholder="9600"
      tooltip="통신 속도"
    />
  </Section>
{:else if type === "Communication.Serial.send"}
  <Section title="데이터">
    <TextareaField
      binding={payloadOf(editor, type).field("data")}
      minHeight={0}
      placeholder="전송할 데이터"
    />
  </Section>
{:else if type === "Communication.Socket.connect"}
  <Section title="URL">
    <TextareaField
      binding={payloadOf(editor, type).field("url")}
      minHeight={0}
      placeholder="Enter로 구분"
    />
  </Section>
{:else if type === "Communication.Socket.connectService"}
  {@const payload = payloadOf(editor, type)}
  <Section title="서비스">
    <TextField
      binding={payload.field("type")}
      prefix="종류"
      placeholder="http"
      tooltip="서비스 종류"
    />
    <TextField
      binding={payload.field("name")}
      prefix="이름"
      placeholder="서비스 이름"
      tooltip="서비스 이름"
    />
  </Section>
{:else if type === "Communication.Socket.send"}
  {@const payload = payloadOf(editor, type)}
  <Section title="채널">
    <TextField binding={payload.field("channel")} />
  </Section>
  <ListSection title="전송할 데이터" binding={payload.field("data")} min={1}>
    {#snippet item(data)}
      <TextareaField binding={data} minHeight={0} />
    {/snippet}
  </ListSection>
{:else if type === "Communication.Mqtt.connect"}
  {@const payload = payloadOf(editor, type)}
  <Section title="URL">
    <TextField binding={payload.field("url")} prefix="URL" tooltip="URL" />
  </Section>
  <ListSection title="구독할 토픽" binding={payload.field("topics")} newItem={() => ""}>
    {#snippet item(topic)}
      <TextField binding={topic} placeholder="토픽" />
    {/snippet}
  </ListSection>
{:else if type === "Communication.Mqtt.publish"}
  {@const payload = payloadOf(editor, type)}
  <Section title="토픽">
    <TextField binding={payload.field("topic")} />
  </Section>
  <Section title="메시지">
    <TextField binding={payload.field("payload")} placeholder="전송할 메시지" />
  </Section>
{/if}
