<script lang="ts">
  import type { Types } from "@shared/projectData/types";
  import type { FieldBinding } from "../../../project/mutator";
  import PluginSelector from "../../input/PluginSelector.svelte";
  import Row from "../layout/Row.svelte";
  import NumberField from "./NumberField.svelte";
  import TextField from "./TextField.svelte";

  let { binding }: { binding: FieldBinding<Types.Transition> } = $props();
</script>

<PluginSelector binding={binding.field("plugin")} type="transition" />
<Row>
  <NumberField
    binding={binding.field("duration")}
    fallback={400}
    prefix="지속"
    suffix="ms"
    placeholder="400"
    tooltip="지속시간"
  />
  <NumberField
    binding={binding.field("delay")}
    fallback={0}
    prefix="지연"
    suffix="ms"
    placeholder="0"
    tooltip="딜레이"
  />
</Row>
<TextField binding={binding.field("easing")} prefix="easing" placeholder="linear" />
