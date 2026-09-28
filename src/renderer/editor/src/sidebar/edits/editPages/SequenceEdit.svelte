<script lang="ts">
  import type { Types } from "@shared/projectData/types";
  import { derivedBinding, type RecordEditor } from "../../../project/mutator";
  import Section from "../layout/Section.svelte";
  import TextField from "../fields/TextField.svelte";
  import CheckboxField from "../fields/CheckboxField.svelte";

  const { editor }: { editor: RecordEditor<"nodes", Types.Sequence> } = $props();

  const concurrency = derivedBinding(
    () => editor.field("concurrency").value === "allow",
    (allow) => editor.field("concurrency").set(allow ? "allow" : "skip")
  );
</script>

<Section>
  <TextField binding={editor.field("alias")} placeholder="이름 없는 시퀀스" tooltip="시퀀스 이름" />
</Section>

<Section title="실행">
  <CheckboxField
    binding={concurrency}
    label="동시 실행 허용"
    tooltip="아직 실행 중인 스텝이 있는 경우 동시 실행을 허용합니다."
  />
</Section>
