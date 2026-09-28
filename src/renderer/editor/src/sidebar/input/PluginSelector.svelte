<script lang="ts">
  import type { FieldBinding } from "../../project/mutator";
  import { getMutator } from "../../project/store";
  import { plugins } from "../../lib/plugins.svelte";
  import SelectField from "../edits/fields/SelectField.svelte";
  import Attributes from "./Attributes.svelte";

  let {
    binding,
    type,
    canUnselect = true
  }: {
    binding: FieldBinding<string>;
    type: keyof typeof plugins;
    canUnselect?: boolean;
  } = $props();

  let pluginId = $derived(binding.value);
  let editor = $derived(getMutator().record("pluginPointers", pluginId));
  let plugin = $derived(editor.value);
</script>

<div class="plugin-select">
  <SelectField
    binding={editor.field("name")}
    options={Object.keys(plugins[type] ?? {})}
    unselectable={canUnselect}
    tooltip="플러그인"
  />
  {#if plugin.name && plugins[type]?.[plugin.name]}
    {@const currentPlugin = plugins[type][plugin.name]}
    {@const exportKeys = Object.keys(currentPlugin.exports)}
    {#if !(exportKeys.length === 1 && exportKeys[0] === "default")}
      <SelectField binding={editor.field("exportName")} options={exportKeys} tooltip="export" />
    {/if}
    {#if currentPlugin.exports[plugin.exportName ?? "default"]}
      <Attributes
        attributes={currentPlugin.exports[plugin.exportName ?? "default"] ?? []}
        binding={editor.field("payloads")}
      />
    {/if}
  {/if}
</div>

<style>
  .plugin-select {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
</style>
