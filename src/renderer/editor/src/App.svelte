<svelte:options runes={true} />

<script lang="ts">
  import ToastDisplay from "./lib/toast/ToastDisplay.svelte";
  import ContextMenu from "./lib/editUtils/contextMenu/ContextMenu.svelte";
  import NodeSpace from "./nodes/NodeSpace.svelte";
  import SideBar from "./sidebar/SideBar.svelte";
  import { onMount, tick } from "svelte";
  import { reloadAllNode } from "./lib/stores";
  import Modal from "./lib/modal/ModalDisplay.svelte";
  import { observingViewport, setViewportSize, viewport } from "./nodes/viewport";
  import { getProject } from "./project/store";
  import TitleBar from "./titleBar/TitleBar.svelte";
  import { ipc } from "./lib/ipc";
  import { editorReady } from "./lib/editorLoad";
  import { setSetting, settings } from "./lib/settings.svelte";
  import Logs from "./sidebar/log/Logs.svelte";
  import { registerMenuAction } from "./titleBar/menuActions";

  let ready = $state(false);
  let showLogs = $state(false);
  onMount(async () => {
    await editorReady();
    console.log("editor ready");

    ready = true;

    showLogs = settings.showLogs;

    const project = getProject();

    viewport.pos.set(project.viewport.pos);
    setViewportSize(project.viewport.size);

    reloadAllNode();

    ipc.send("editor-win-ready");
  });

  function setLogVisiblity(v: boolean) {
    showLogs = v;
    setSetting("showLogs", v);
  }

  registerMenuAction("view:log-toggle", () => {
    setLogVisiblity(!showLogs);
  });
</script>

<div class="root">
  <TitleBar />
  <ContextMenu />
  <div class="window" use:observingViewport>
    <Modal />
    {#if ready}
      <div class="panels">
        <SideBar />
        <div class="y-panels">
          <div class="center">
            <ToastDisplay />
          </div>
          {#if showLogs}
            <Logs close={() => setLogVisiblity(false)} />
          {/if}
        </div>
      </div>
    {/if}
  </div>
  <NodeSpace />
</div>

<style>
  .root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .window {
    position: relative;
    width: 100%;
    flex: 1 1 auto;
  }
  .panels {
    width: 100%;
    height: 100%;
    position: absolute;
    overflow: hidden;
    z-index: var(--panels-z);

    left: 0;
    top: 0;

    pointer-events: none;

    display: flex;
    flex-direction: row;
  }
  .y-panels {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .center {
    flex: 1 1 auto;
    position: relative;
  }
</style>
