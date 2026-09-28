<script lang="ts">
  import * as Easings from "easing-utils";
  import { CoordDefinition, createDragOption } from "@shared/projectData/definitions";
  import type { Types } from "@shared/projectData/types";
  import { derivedBinding, type FieldBinding } from "../../../project/mutator";
  import Checkbox from "../../input/Checkbox.svelte";
  import Section from "../layout/Section.svelte";
  import ListSection from "../layout/ListSection.svelte";
  import Row from "../layout/Row.svelte";
  import CheckboxField from "../fields/CheckboxField.svelte";
  import NumberField from "../fields/NumberField.svelte";
  import SelectField from "../fields/SelectField.svelte";
  import PositionField from "../fields/PositionField.svelte";

  let { binding }: { binding: FieldBinding<Types.DragOption> } = $props();
  let dragOption = $derived(binding.value);
  /** Only valid while `use` is on; the other fields don't exist otherwise. */
  let enabled = $derived(binding as FieldBinding<Types.EnabledDragOption>);

  const use = derivedBinding(
    () => !!dragOption.use,
    (next) => binding.set(createDragOption({ ...(next ? dragOption : {}), use: next }))
  );

  const SnapOptions = { never: "스냅 없음", drag: "드래그 도중 스냅", release: "놓았을 때 스냅" };
</script>

<Section title="드래그">
  {#snippet actions()}
    <Checkbox value={use.value} onclick={() => use.set(!use.value)} />
  {/snippet}
  {#if dragOption.use}
    <Row>
      <CheckboxField binding={enabled.field("returnOnRelease")} label="놓으면 위치 복귀" />
      {#if dragOption.returnOnRelease}
        <NumberField
          binding={enabled.field("returnDuration")}
          fallback={0}
          prefix="복귀"
          suffix="ms"
          placeholder="0"
          tooltip="복귀 시간"
        />
      {/if}
    </Row>
    <Row>
      <SelectField binding={enabled.field("snapOn")} options={SnapOptions} tooltip="스냅" />
      {#if dragOption.snapOn !== "never"}
        <NumberField
          binding={enabled.field("snapDuration")}
          fallback={0}
          prefix="스냅"
          suffix="ms"
          placeholder="0"
          tooltip="스냅 시간"
        />
      {/if}
    </Row>
    <Row>
      <NumberField
        binding={enabled.field("threshold")}
        fallback={0}
        prefix="허용치"
        suffix="px"
        placeholder="0"
        tooltip="인식 허용치"
      />
      <SelectField
        binding={enabled.field("moveEasing")}
        options={Object.keys(Easings)}
        placeholder="ease"
        tooltip="easing"
      />
    </Row>
    <ListSection
      title="인식 좌표"
      binding={enabled.field("hotspots")}
      newItem={() => CoordDefinition.create()}
    >
      {#snippet item(hotspot)}
        <PositionField binding={hotspot} />
      {/snippet}
    </ListSection>
  {/if}
</Section>
