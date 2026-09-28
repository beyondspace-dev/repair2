<script lang="ts">
  import Icon from "../../../assets/icons/Icon.svelte";
  import { tippy } from "../../../lib/tippy/tippy";
  import { tooltipOptions } from "../fields/tooltip";

  let {
    icon,
    tooltip = null,
    size = 11,
    onclick
  }: {
    icon: string;
    tooltip?: string | null;
    size?: number;
    onclick: () => unknown;
  } = $props();
</script>

<button type="button" class="icon-button" {onclick} use:tippy={tooltipOptions(tooltip)}>
  <Icon {icon} color="#fff" {size} lineWidth={1.5} />
</button>

<style>
  .icon-button {
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 8px;
    corner-shape: squircle;
    cursor: pointer;
    opacity: 0.6;
  }
  .icon-button:hover {
    opacity: 1;
    background-color: var(--w-o1);
  }
</style>
