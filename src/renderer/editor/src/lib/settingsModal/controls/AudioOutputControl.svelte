<script lang="ts">
  import { onDestroy } from "svelte";
  import type { SpecialField } from "@shared/setting/settings.types";
  import Select from "../../../sidebar/input/Select.svelte";
  import type { SettingControlProps } from "../settingControls";
  import RefreshButton from "./RefreshButton.svelte";

  const VIRTUAL_DEVICE_IDS = new Set(["default", "communications"]);

  let { field, value, onchange }: SettingControlProps<SpecialField> = $props();

  let labels = $state<string[] | null>(null);
  let loading = $state(false);

  async function load() {
    loading = true;
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    labels = [
      ...new Set(
        devices
          .filter((d) => d.kind === "audiooutput" && !VIRTUAL_DEVICE_IDS.has(d.deviceId))
          .map((d) => d.label)
          .filter(Boolean)
      )
    ];
    loading = false;
  }
  load();

  navigator.mediaDevices.addEventListener("devicechange", load);
  onDestroy(() => navigator.mediaDevices.removeEventListener("devicechange", load));

  let options = $derived.by(() => {
    const list: [string, string][] = (labels ?? []).map((l) => [l, l]);
    if (typeof value === "string" && labels && !labels.includes(value))
      list.push([value, `${value} (연결되지 않음)`]);
    return list;
  });

  let placeholder = $derived(labels ? "시스템 기본 장치" : "불러오는 중…");
</script>

<div class="row">
  <Select
    value={typeof value === "string" ? value : null}
    {options}
    {placeholder}
    unselectable={!!field.nullable}
    onchange={(v) => onchange(v)}
  />
  <RefreshButton {loading} onclick={load} />
</div>

<style>
  .row {
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: stretch;
  }
  .row > :global(.select) {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
