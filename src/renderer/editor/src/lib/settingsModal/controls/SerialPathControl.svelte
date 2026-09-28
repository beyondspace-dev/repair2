<script lang="ts">
  import type { SpecialField } from "@shared/setting/settings.types";
  import type { IpcSerialPortInfo } from "@shared/ipc.types";
  import Select from "../../../sidebar/input/Select.svelte";
  import { ipc } from "../../ipc";
  import type { SettingControlProps } from "../settingControls";
  import RefreshButton from "./RefreshButton.svelte";

  let { field, value, onchange }: SettingControlProps<SpecialField> = $props();

  let ports = $state<IpcSerialPortInfo[] | null>(null);
  let loading = $state(false);

  async function load() {
    loading = true;
    ports = await ipc.invoke("serial:list-ports").catch(() => []);
    loading = false;
  }
  load();

  function portLabel(p: IpcSerialPortInfo) {
    if (!p.friendlyName) return p.path;
    return p.friendlyName.includes(p.path) ? p.friendlyName : `${p.path} · ${p.friendlyName}`;
  }

  let options = $derived.by(() => {
    const list: [string, string][] = (ports ?? []).map((p) => [p.path, portLabel(p)]);
    if (typeof value === "string" && ports && !ports.some((p) => p.path === value))
      list.push([value, `${value} (연결되지 않음)`]);
    return list;
  });

  let placeholder = $derived(
    !ports ? "불러오는 중…" : ports.length ? "선택 안 함" : "선택 안 함 (연결된 포트 없음)"
  );
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
