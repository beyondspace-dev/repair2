<script lang="ts">
  import { ValueProcessTypes } from "../../../lib/translate";
  import { payloadOf, type RecordEditor } from "../../../project/mutator";
  import TypeInput from "../../input/TypeInput.svelte";
  import Section from "../layout/Section.svelte";
  import TextField from "../fields/TextField.svelte";
  import TextareaField from "../fields/TextareaField.svelte";

  const { editor }: { editor: RecordEditor<"valueProcesses"> } = $props();
  let data = $derived(editor.value);
</script>

<Section>
  <TypeInput binding={editor} typeName="valueProcess" options={ValueProcessTypes} />
</Section>

{#if data.type === "replaceAll"}
  {@const payload = payloadOf(editor, "replaceAll")}
  <Section title={ValueProcessTypes[data.type]}>
    <TextField
      binding={payload.field("from")}
      placeholder="변경 전 문자열"
      tooltip="변경 전 문자열"
    />
    <TextField binding={payload.field("to")} placeholder="대체할 문자열" tooltip="대체할 문자열" />
  </Section>
{:else if data.type === "removeAll"}
  <Section title={ValueProcessTypes[data.type]}>
    <TextField
      binding={payloadOf(editor, "removeAll").field("removing")}
      placeholder="삭제할 문자열"
      tooltip="삭제할 문자열"
    />
  </Section>
{:else if data.type === "replaceAllRegex"}
  {@const payload = payloadOf(editor, "replaceAllRegex")}
  <Section title={ValueProcessTypes[data.type]}>
    <TextField binding={payload.field("regex")} placeholder="정규표현식" tooltip="정규표현식" />
    <TextField
      binding={payload.field("to")}
      placeholder="$&, $1 등 패턴 사용 가능"
      tooltip="대체할 문자열"
    />
  </Section>
{:else if data.type === "jsFunction"}
  <Section title={ValueProcessTypes[data.type]}>
    <TextareaField
      binding={payloadOf(editor, "jsFunction").field("scriptData")}
      code
      placeholder="return value;"
    />
  </Section>
{/if}
