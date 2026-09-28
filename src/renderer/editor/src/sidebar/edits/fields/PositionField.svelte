<script lang="ts">
  import type { Types } from "@shared/projectData/types";
  import type { FieldBinding } from "../../../project/mutator";
  import NumberField from "./NumberField.svelte";

  let {
    binding,
    onpreview = null
  }: {
    binding: FieldBinding<Types.Coord>;
    onpreview?: (() => unknown) | null;
  } = $props();

  type Origin = Types.Position["origin"];
  const Origins = ["start", "center", "end"] as const satisfies Origin[];
  const Axes = ["x", "y"] as const;

  let coord = $derived(binding.value);

  function setOrigins(x: Origin, y: Origin) {
    binding.set({ x: { ...coord.x, origin: x }, y: { ...coord.y, origin: y } });
    onpreview?.();
  }

  function toggleUnit(axis: (typeof Axes)[number]) {
    binding.field(axis).field("relative").set(!coord[axis].relative);
    onpreview?.();
  }
</script>

<div class="position-field">
  <div class="grid">
    {#each { length: 9 }, i}
      {@const x = Origins[i % 3]}
      {@const y = Origins[Math.trunc(i / 3)]}
      <button
        type="button"
        class={["dot", coord.x.origin === x && coord.y.origin === y && "current"]}
        aria-label={`${x} ${y}`}
        onclick={() => setOrigins(x, y)}
      ></button>
    {/each}
  </div>
  <div class="axes">
    {#each Axes as axis}
      {#if coord[axis].origin === "center"}
        <div class="centered"><span>{axis.toUpperCase()}</span>중앙</div>
      {:else}
        {#snippet unit()}
          <button type="button" class="unit" onclick={() => toggleUnit(axis)}>
            {coord[axis].relative ? "%" : "px"}
          </button>
        {/snippet}
        <NumberField
          binding={binding.field(axis).field("distance")}
          prefix={axis.toUpperCase()}
          suffix={unit}
          placeholder="0"
          tooltip={`${axis === "x" ? "가로" : "세로"} 좌표`}
          {onpreview}
        />
      {/if}
    {/each}
  </div>
</div>

<style>
  .position-field {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  .grid {
    flex: 0 0 auto;
    width: 62px;
    height: 62px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 4px;
    padding: 0;
  }
  .dot {
    padding: 0;
    cursor: pointer;
    border: solid rgba(255, 255, 255, 0.4) 1px;
    box-sizing: border-box;
    corner-shape: squircle;
  }
  .dot:nth-child(1) {
    border-top-left-radius: 10px;
  }
  .dot:nth-child(3) {
    border-top-right-radius: 10px;
  }
  .dot:nth-child(7) {
    border-bottom-left-radius: 10px;
  }
  .dot:nth-child(9) {
    border-bottom-right-radius: 10px;
  }
  .dot.current {
    border-color: var(--blue-bright);
    background-color: rgba(78, 134, 255, 0.5);
  }
  .dot:not(.current):hover {
    border-color: #fff;
  }
  .axes {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .unit {
    padding: 0 2px;
    color: var(--w-o6);
    font-size: 12px;
    cursor: pointer;
  }
  .unit:hover {
    color: #fff;
  }
  .centered {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding-inline: 8px;
    box-sizing: border-box;
    border-radius: 10px;
    corner-shape: squircle;
    background-color: var(--w-o1);
    color: var(--w-o6);
    font-size: 14px;
  }
  .centered span {
    font-size: 12px;
  }
</style>
