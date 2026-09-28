<script lang="ts">
  import { ElementTypes, InputAllowedTypes } from "../../../lib/translate";
  import { reloadPreview } from "../../../lib/editUtils/preview";
  import { payloadOf, type RecordEditor } from "../../../project/mutator";
  import TypeInput from "../../input/TypeInput.svelte";
  import PluginSelector from "../../input/PluginSelector.svelte";
  import Section from "../layout/Section.svelte";
  import Row from "../layout/Row.svelte";
  import TextField from "../fields/TextField.svelte";
  import TextareaField from "../fields/TextareaField.svelte";
  import NumberField from "../fields/NumberField.svelte";
  import CheckboxField from "../fields/CheckboxField.svelte";
  import SelectField from "../fields/SelectField.svelte";
  import VariableField from "../fields/VariableField.svelte";
  import ResourceField from "../fields/ResourceField.svelte";
  import PositionField from "../fields/PositionField.svelte";
  import SizeField from "../fields/SizeField.svelte";
  import DragSection from "../sections/DragSection.svelte";

  const { editor }: { editor: RecordEditor<"elements"> } = $props();
  let data = $derived(editor.value);
</script>

<Section>
  <TextField binding={editor.field("alias")} placeholder="요소 이름" tooltip="요소 이름" />
  <TypeInput binding={editor} typeName="element" options={ElementTypes} />
</Section>

{#if data.type === "image" || data.type === "video"}
  {@const payload = payloadOf(editor, data.type)}
  <Section title={ElementTypes[data.type]}>
    <ResourceField binding={payload.field("resourceId")} type={data.type} />
    {#if data.type === "video"}
      {@const video = payloadOf(editor, "video")}
      <Row>
        <CheckboxField binding={video.field("loop")} label="반복 재생" />
        <NumberField
          binding={video.field("volume")}
          prefix="음량"
          placeholder="0-100"
          tooltip="음량 (0-100 사이의 실수)"
          min={0}
          max={100}
        />
      </Row>
    {/if}
    <CheckboxField binding={payload.field("removePreload")} label="생성 후 프리로드 제거" />
  </Section>
{:else if data.type === "input"}
  {@const payload = payloadOf(editor, "input")}
  <Section title="입력">
    <VariableField binding={payload.field("variableId")} tooltip="변수 할당" />
    <TextField
      binding={payload.field("placeholder")}
      placeholder="플레이스홀더"
      tooltip="플레이스홀더"
    />
    <Row>
      <SelectField
        binding={payload.field("allowedType")}
        options={InputAllowedTypes}
        tooltip="입력 유형"
      />
      <NumberField
        binding={payload.field("maxLength")}
        prefix="최대"
        placeholder="제한 없음"
        tooltip="글자 최대 길이"
      />
    </Row>
    {#if data.payload.allowedType === "regex"}
      <TextField
        binding={payload.field("allowedRegex")}
        prefix="정규식"
        placeholder="허용할 문자열 정규표현식"
      />
    {/if}
    <Row>
      <CheckboxField binding={payload.field("autofocus")} label="생성 시 자동 선택" />
      <CheckboxField binding={payload.field("isTextarea")} label="큰 입력칸" />
    </Row>
    <Section title="문자열 변형 함수">
      <TextareaField binding={payload.field("valueFunction")} code placeholder="return value;" />
    </Section>
  </Section>
{:else if data.type === "advancedInput"}
  {@const payload = payloadOf(editor, "advancedInput")}
  <Section title="고급 입력">
    <VariableField binding={payload.field("variableId")} tooltip="변수 할당" />
    <Row>
      <NumberField
        binding={payload.field("maxLength")}
        prefix="최대"
        placeholder="제한 없음"
        tooltip="글자 최대 길이"
      />
      <TextField
        binding={payload.field("securityText")}
        prefix="가림"
        placeholder="없음"
        tooltip="가림 문자"
        maxlength={1}
      />
    </Row>
  </Section>
{:else if data.type === "empty"}
  {@const payload = payloadOf(editor, "empty")}
  <Section title="내용">
    <TextareaField
      binding={payload.field("content")}
      code={data.payload.isHtml}
      placeholder={data.payload.isHtml ? "HTML code" : "문자열"}
    />
    <CheckboxField binding={payload.field("isHtml")} label="HTML로 렌더링" />
  </Section>
{:else if data.type === "plugin"}
  <Section title="플러그인">
    <PluginSelector
      binding={payloadOf(editor, "plugin").field("plugin")}
      type="element"
      canUnselect={false}
    />
  </Section>
{/if}

<Section title="외형">
  <Row>
    <CheckboxField binding={editor.field("fullscreen")} label="전체화면" onchange={reloadPreview} />
    {#if !data.fullscreen}
      <CheckboxField
        binding={editor.field("absolute")}
        label="위치 지정"
        onchange={reloadPreview}
      />
    {/if}
  </Row>
  {#if !data.fullscreen}
    {#if data.absolute}
      <PositionField binding={editor.field("pos")} onpreview={reloadPreview} />
    {/if}
    <SizeField
      width={editor.field("width")}
      height={editor.field("height")}
      placeholder="자동"
      onpreview={reloadPreview}
    />
  {/if}
</Section>

<Section title="스타일">
  <TextField
    binding={editor.field("className")}
    prefix="class"
    placeholder="띄어쓰기로 구분"
    tooltip="CSS 클래스명"
    onpreview={reloadPreview}
  />
  <TextareaField
    binding={editor.field("style")}
    code
    placeholder="CSS 코드"
    tooltip="CSS 코드"
    onpreview={reloadPreview}
  />
  <TextareaField
    binding={editor.field("childStyle")}
    code
    placeholder="내부 CSS 코드"
    tooltip="내부 CSS 코드"
  />
</Section>

{#if !data.fullscreen}
  <DragSection binding={editor.field("dragOption")} />
{/if}
