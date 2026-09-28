<script lang="ts">
  import type { SpecialField } from "@shared/setting/settings.types";
  import type { IpcDisplayInfo } from "@shared/ipc.types";
  import Select from "../../../sidebar/input/Select.svelte";
  import { ipc } from "../../ipc";
  import type { SettingControlProps } from "../settingControls";
  import RefreshButton from "./RefreshButton.svelte";

  let { field, value, onchange }: SettingControlProps<SpecialField> = $props();

  let displays = $state<IpcDisplayInfo[] | null>(null);
  let loading = $state(false);

  async function load() {
    loading = true;
    displays = await ipc.invoke("system:get-displays").catch(() => []);
    loading = false;
  }
  load();

  function displayLabel(d: IpcDisplayInfo, i: number) {
    const name = d.label || `디스플레이 ${i + 1}`;
    const size = `${d.bounds.width}×${d.bounds.height}`;
    return `${name}${d.primary ? " (주 디스플레이)" : ""} · ${size}`;
  }

  let options = $derived.by(() => {
    const list: [number, string][] = (displays ?? []).map((d, i) => [d.id, displayLabel(d, i)]);
    if (typeof value === "number" && displays && !displays.some((d) => d.id === value))
      list.push([value, `연결되지 않은 디스플레이 (${value})`]);
    return list;
  });
</script>

<div class="row">
  <Select
    value={typeof value === "number" ? value : null}
    {options}
    placeholder={displays ? "선택 안 함" : "불러오는 중…"}
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
