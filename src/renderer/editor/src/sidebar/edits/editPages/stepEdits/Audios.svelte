<script lang="ts">
  import { payloadOf, type RecordEditor } from "../../../../project/mutator";
  import Row from "../../layout/Row.svelte";
  import TextField from "../../fields/TextField.svelte";
  import NumberField from "../../fields/NumberField.svelte";
  import CheckboxField from "../../fields/CheckboxField.svelte";
  import ResourceField from "../../fields/ResourceField.svelte";
  import Section from "../../layout/Section.svelte";

  const { editor }: { editor: RecordEditor<"steps"> } = $props();
  let type = $derived(editor.value.type);
</script>

{#if type === "Audio.play" || type === "Audio.pause" || type === "Audio.resume" || type === "Audio.changeVolume"}
  <Section title="채널명">
    <TextField
      binding={payloadOf(editor, type).field("channel")}
      prefix="채널"
      placeholder="default"
      tooltip="채널명"
    />
  </Section>
{/if}
{#if type === "Audio.play"}
  <Section title="오디오">
    {@const payload = payloadOf(editor, "Audio.play")}
    <ResourceField binding={payload.field("resourceId")} type="audio" />
    <Row>
      <CheckboxField binding={payload.field("loop")} label="반복 재생" />
      <NumberField
        binding={payload.field("volume")}
        prefix="음량"
        placeholder="0-100"
        tooltip="음량"
        min={0}
        max={100}
      />
    </Row>
  </Section>
{:else if type === "Audio.changeVolume"}
  <Section title="음량">
    {@const payload = payloadOf(editor, "Audio.changeVolume")}
    <Row columns="2fr 1fr">
      <NumberField
        binding={payload.field("volume")}
        placeholder="0-100"
        tooltip="변경할 음량"
        min={0}
        max={100}
      />
      <NumberField
        binding={payload.field("duration")}
        suffix="초"
        placeholder="0"
        tooltip="변화 시간(초)"
        min={0}
      />
    </Row>
  </Section>
{/if}
