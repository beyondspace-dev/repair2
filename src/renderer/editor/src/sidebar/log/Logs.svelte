<script lang="ts">
  import Icon from "../../assets/icons/Icon.svelte";
  import { setSetting, settings } from "../../lib/settings.svelte";
  import { panel } from "../panel/panel";
  import logs from "./logs";

  import "./logs.scss";

  let { close }: { close(): unknown } = $props();
</script>

<div
  class="wrapper"
  use:panel={{
    minSize: 150,
    startSize: settings.logHeight,
    dir: "bottom",
    onResize: (s) => setSetting("logHeight", s)
  }}
>
  <div class="title">
    <span>Logs</span>
    <button class="close" onclick={close}>
      <Icon icon="close" color="#fff" lineWidth={1} size={15} />
    </button>
  </div>
  <div class="logs scroll" use:logs></div>
</div>

<style>
  .wrapper {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
  }
  .title {
    flex: 0 0 auto;
    font-weight: 600;
    box-sizing: border-box;
    width: 100%;
    font-family: Pretend;
    font-size: 16px;
    padding: 4px 8px 4px 16px;
    border-bottom: solid var(--w-o6) 1px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  button.close {
    padding: 6px;
    border-radius: 10px;
    corner-shape: squircle;
    cursor: pointer;
  }
  button.close:hover {
    background-color: var(--w-o1);
  }
</style>
