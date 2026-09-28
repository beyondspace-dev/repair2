<script lang="ts">
  import type { Types } from "@shared/projectData/types";
  import { plugins } from "../../../../lib/plugins.svelte";
  import { getMutator, getProject } from "../../../../project/store";
  import { payloadOf, type FieldBinding, type RecordEditor } from "../../../../project/mutator";
  import Attributes from "../../../input/Attributes.svelte";
  import SelectField from "../../fields/SelectField.svelte";
  import CheckboxField from "../../fields/CheckboxField.svelte";
  import Section from "../../layout/Section.svelte";

  type RuntimePluginStep = Extract<Types.Step, { type: "Others.runtimePluginStep" }>;

  const { editor }: { editor: RecordEditor<"steps"> } = $props();
  let data = $derived(editor.value as RuntimePluginStep);
  let payload = $derived(payloadOf(editor, "Others.runtimePluginStep"));
  /** Plugin step attributes are stored as plain JSON. */
  let payloads = $derived(payload.field("payloads") as FieldBinding<Record<string, string>>);

  let runtimePluginIds = $derived(getMutator().config().field("runtimePlugins").value);
  let runtimePluginNames = $derived(
    runtimePluginIds
      .map((id) => (id ? getProject().pluginPointers.get(id)?.name : null))
      .filter((name): name is string => !!name && !!plugins.runtime?.[name]?.steps)
  );
  let runtimePluginInfo = $derived(
    data.payload.pluginName && runtimePluginNames.includes(data.payload.pluginName)
      ? plugins.runtime?.[data.payload.pluginName]
      : null
  );
</script>

<Section title="런타임 플러그인">
  <SelectField binding={payload.field("pluginName")} options={runtimePluginNames} />
</Section>
{#if runtimePluginInfo?.steps}
  <SelectField
    binding={payload.field("step")}
    options={Object.keys(runtimePluginInfo.steps)}
    tooltip="스텝"
  />
  {#if data.payload.step && runtimePluginInfo.steps[data.payload.step]}
    {#key data.payload.step}
      <Attributes
        attributes={runtimePluginInfo.steps[data.payload.step] ?? []}
        binding={payloads}
      />
    {/key}
  {/if}
{/if}
<CheckboxField binding={payload.field("waitTillEnd")} label="끝날 때까지 기다리기" />
