<script lang="ts">
  import { hoverHighlight } from "../../lib/highlight";
  import Icon from "../../assets/icons/Icon.svelte";
  import { getVscode, openVscode } from "../../lib/vscode";
  import { tippy } from "../../lib/tippy";
  import type { PluginRendererInfo } from "@shared/plugin.types";
  import { rightclick } from "../../lib/editUtils/contextMenu/contextUtils";
  import { ipc } from "../../lib/ipc";
  import type { MenuItem } from "../../lib/menu/menu.types";

  let { info }: { info: PluginRendererInfo } = $props();

  // let moreBtn = $state(null);
  // let showOpt = $state(false);

  let color = $derived(info.error ? "#ff3636" : "#fff");

  function getContextMenu(): MenuItem[] {
    return [
      {
        label: "다시 빌드",
        disabled: !!(info.linked && !info.linked.linked),
        activate: () => ipc.invoke("plugin:rebuild", info.name)
      },
      ...(info.linked
        ? [
            {
              label: "원본 다시 지정",
              activate: () => ipc.invoke("plugin:relink", info.name)
            }
          ]
        : []),
      { type: "separator" },
      {
        label: (info.linked ? "원본 " : "") + "폴더 열기",
        disabled: !!(info.linked && !info.linked.linked),
        activate: () => ipc.send("open-dir", info.linked?.sourcePath ?? info.path)
      },
      {
        label: "플러그인 제거",
        activate: () => ipc.invoke("plugin:delete", info.name)
      }
    ];
  }
</script>

<div
  use:tippy={{
    maxWidth: 250,
    placement: "bottom",
    animation: "fade",
    theme: (info.error && "error") || undefined,
    content: info.error
      ? info.error.map((e) => e[1].summary ?? e[1].title).join("<hr/>")
      : `${info.linked?.sourcePath ?? info.path}`,
    delay: [200, null],
    duration: [200, 0],
    allowHTML: true
  }}
  class="plugin"
  use:hoverHighlight={{ type: "plugin", data: info.name }}
  use:rightclick={{ items: getContextMenu }}
>
  {#if info.svelte}
    <Icon icon="svelte" {color} size={16} />
  {/if}
  <span class={["name", info.error && "error"]}>
    {info.name}
  </span>
  {#if info.error}
    <Icon icon="warn" {color} size={16} />
  {/if}
  {#if info.linked}
    <Icon
      icon={info.linked.linked ? "linked" : "unlinked"}
      color="rgba(255, 255, 255, .6)"
      size={16}
    />
  {/if}
  {#if getVscode()}
    <button class="more" onclick={() => openVscode(info.linked?.sourcePath ?? info.path)}>
      <Icon icon="vscode" color="#fff" size={18} />
    </button>
  {/if}
</div>

<style>
  .plugin {
    flex: 0 0 auto;
    width: 100%;
    border-radius: 14px;
    corner-shape: squircle;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding-inline: 5px 3px;
    border: solid transparent 1px;
    flex-direction: row;
    gap: 5px;
    align-items: center;
    font-weight: 300;
    height: 30px;
  }
  .plugin:global(.contextmenu) {
    outline: solid var(--orange-contextmenu) 1px;
  }
  .plugin:hover {
    border-color: var(--w-o2);
  }
  .name {
    margin-right: auto;
  }
  .error {
    font-weight: 600;
    color: #ff3636;
  }
  .more {
    padding: 3px 3px;
    border-radius: 10px;
    corner-shape: squircle;
    display: none;
    cursor: pointer;
  }
  .plugin:hover > .more {
    display: block;
  }
  .more:hover {
    background-color: var(--w-o1);
  }
</style>
