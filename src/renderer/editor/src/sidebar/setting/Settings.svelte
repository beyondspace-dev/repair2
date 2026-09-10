<script lang="ts">
  import { SettingFields, type SettingValueMap } from "@shared/setting/settingFields";
  import { ipc } from "../../lib/ipc";

  let settings = $state<SettingValueMap | null>(null);

  ipc.invoke("settings:get-all").then((result) => (settings = result));
</script>

<div class="configs">
  {#if !settings}
    LOADING SETTINGS
  {:else}
    {#each SettingFields as f}
      {f.id}<br />
      {f.name}<br />
      {#if "description" in f}
        {f.description}<br />
      {/if}
      {f.type}<br />
      {settings[f.id]}<br />
      <hr />
    {/each}
  {/if}
</div>

<style>
  .configs {
    width: 100%;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden scroll;
    padding-block: 20px 70px;
    gap: 15px;
    box-sizing: border-box;
    padding-inline: 14px;
    --hr-pad: -14px;
  }
</style>
