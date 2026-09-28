<script lang="ts">
  import type { Types } from "@shared/projectData/types";
  import type { RecordEditor } from "../../../project/mutator";
  import Section from "../layout/Section.svelte";
  import TextField from "../fields/TextField.svelte";
  import VariableField from "../fields/VariableField.svelte";

  const { editor }: { editor: RecordEditor<"nodes", Types.VariableSet> } = $props();
</script>

<Section>
  <TextField binding={editor.field("alias")} placeholder="노드 이름" tooltip="노드 이름" />
</Section>

<Section title="설정할 변수">
  <VariableField binding={editor.field("variable")} unselectable={false} placeholder="변수 선택" />
</Section>
