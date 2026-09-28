<script lang="ts">
  import Variables from "./variable/Variables.svelte";
  import Resources from "./resource/Resources.svelte";
  import Plugins from "./plugins/Plugins.svelte";
  import BigIcons from "../assets/icons/BigIcons.svelte";
  import { tippySingleton } from "../lib/tippy/tippy";
  import { panel } from "./panel/panel";
  import { setSetting, settings } from "../lib/settings.svelte";
  import { openSettings, settingsModal } from "../lib/settingsModal/settingsModalState.svelte";
  import { registerMenuAction } from "../titleBar/menuActions";
  import { onMount } from "svelte";

  const TAB_BAR_WIDTH = 47;

  const tabs = {
    resources: "Resources",
    variables: "Variables",
    plugins: "Plugins"
  } as const;

  type Tab = keyof typeof tabs;
  const tabButtons = ["resources", "variables", "plugins"] as const satisfies Tab[];

  let openTab = $state<Tab | null>(null);
  let lastTab: Tab = "resources";

  function toggleTab(id: Tab) {
    openTab = openTab === id ? null : id;
    if (openTab) lastTab = openTab;
  }
  toggleTab(lastTab);

  onMount(() =>
    registerMenuAction("view:sidebar-toggle", () => {
      openTab = openTab ? null : lastTab;
    })
  );
</script>

<div
  class="side-bar"
  use:panel={{
    dir: "left",
    startSize: settings.sidebarWidth,
    minSize: 310,
    collapsed: openTab === null,
    collapsedSize: TAB_BAR_WIDTH,
    onResize: (s) => setSetting("sidebarWidth", s)
  }}
>
  <div
    class="tabs"
    style:width="{TAB_BAR_WIDTH}px"
    use:tippySingleton={{ duration: 100, delay: [400, 0], placement: "right" }}
  >
    {#each tabButtons as id}
      <button
        class={["tab-wrapper", openTab === id && "active"]}
        onclick={() => toggleTab(id)}
        data-tippy-content={tabs[id]}
      >
        <div class="tab">
          <BigIcons icon={id} color="#fff" size={30} />
        </div>
      </button>
    {/each}
    <div class="tab-btn-spacer"></div>
    <button
      class={["tab-wrapper", settingsModal.open && "active"]}
      onclick={openSettings}
      data-tippy-content="Settings (Ctrl+,)"
    >
      <div class="tab">
        <BigIcons icon="settings" color="#fff" size={30} />
      </div>
    </button>
  </div>
  {#if openTab}
    <div class="side-bar-body">
      <div class="title">{tabs[openTab]}</div>
      {#if openTab === "variables"}
        <Variables />
      {:else if openTab === "resources"}
        <Resources />
      {:else if openTab === "plugins"}
        <Plugins />
      {/if}
    </div>
  {/if}
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
  .tabs {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    box-sizing: border-box;
    border-right: solid var(--w-o6) 1px;
  }
  .tab-btn-spacer {
    flex: 1 1 auto;
  }
  .tab-wrapper {
    padding: 3px;
    cursor: pointer;
    opacity: 0.5;
  }
  .tab-wrapper:hover,
  .tab-wrapper.active {
    opacity: 1;
  }
  .tab {
    box-sizing: border-box;
    padding: 5px;
    border-radius: 16px;
    corner-shape: squircle;
    flex: 0 0 auto;
    margin-bottom: 3px;
  }
  .tab-wrapper.active > .tab {
    background-color: var(--w-o1);
  }
  .side-bar-body {
    border-right: solid var(--w-o6) 1px;
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
