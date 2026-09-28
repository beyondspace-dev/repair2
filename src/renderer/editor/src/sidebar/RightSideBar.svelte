<script lang="ts">
  import Edit from "./edits/Edit.svelte";
  import { panel } from "./panel/panel";
  import { setSetting, settings } from "../lib/settings.svelte";

  let title = $state("");
</script>

<div
  class="side-bar"
  use:panel={{
    dir: "right",
    startSize: settings.editPanelWidth,
    minSize: 310,
    onResize: (s) => setSetting("editPanelWidth", s)
  }}
>
  <div class="side-bar-body">
    <div class="title">{title}</div>
    <Edit bind:title />
  </div>
</div>

<style>
  .side-bar {
    height: 100%;
    padding: 0;
    box-sizing: border-box;
    font-family: "Pretend";
    user-select: none;
    display: flex;
    flex-direction: row;

    flex: 0 0 auto;
  }
  .side-bar-body {
    border-left: solid var(--w-o6) 1px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1 1 auto;

    contain: size;
  }
  .title {
    font-size: 20px;
    padding: 15px 0 15px 20px;
    border-bottom: solid var(--w-o6) 1px;
    font-weight: 600;
    flex: 0 0 auto;
  }
</style>
