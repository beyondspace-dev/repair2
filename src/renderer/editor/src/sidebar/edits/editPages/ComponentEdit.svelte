<script lang="ts">
  import { reloadPreview } from "../../../lib/editUtils/preview";
  import type { RecordEditor } from "../../../project/mutator";
  import Toggles from "../../input/Toggles.svelte";
  import PluginSelector from "../../input/PluginSelector.svelte";
  import Section from "../layout/Section.svelte";
  import Row from "../layout/Row.svelte";
  import TextField from "../fields/TextField.svelte";
  import TextareaField from "../fields/TextareaField.svelte";
  import NumberField from "../fields/NumberField.svelte";
  import PositionField from "../fields/PositionField.svelte";
  import TransitionField from "../fields/TransitionField.svelte";

  const { editor }: { editor: RecordEditor<"components"> } = $props();
</script>

<Section>
  <Row columns="1fr auto">
    <TextField
      binding={editor.field("alias")}
      placeholder="이름 없는 컴포넌트"
      tooltip="컴포넌트 이름"
    />
    <Toggles
      toggles={[
        { trueIcon: "locked", falseIcon: "unlocked", binding: editor.field("unbreakable") },
        { trueIcon: "visible", falseIcon: "invisible", binding: editor.field("visible") }
      ]}
    />
  </Row>
</Section>

<Section title="외형">
  <PositionField binding={editor.field("pos")} onpreview={reloadPreview} />
  <NumberField
    binding={editor.field("zIndex")}
    prefix="Z"
    placeholder="값이 클수록 앞에 보임"
    tooltip="Z축 위치"
  />
</Section>

<Section title="스타일">
  <TextareaField
    binding={editor.field("style")}
    code
    placeholder="CSS 코드"
    tooltip="CSS 코드"
    onpreview={reloadPreview}
  />
  <Section title="프레임">
    <PluginSelector binding={editor.field("frame")} type="frame" />
  </Section>
</Section>

<Section title="트랜지션">
  <Section title="인트로">
    <TransitionField binding={editor.field("introTransition")} />
  </Section>
  <Section title="아웃트로">
    <TransitionField binding={editor.field("outroTransition")} />
  </Section>
</Section>
