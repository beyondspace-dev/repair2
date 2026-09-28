<script lang="ts">
  import { dataTargetKey } from "@shared/projectData/ref";
  import Icon from "../../../assets/icons/Icon.svelte";
  import { tippy } from "../../../lib/tippy/tippy";
  import { tooltipOptions } from "./tooltip";
  import type { EditSession, FieldBinding } from "../../../project/mutator";
  import InputBox from "./InputBox.svelte";
  import { FieldInput, parseNumber } from "./fieldInput.svelte";
  import { sizeLocks } from "./sizeLock.svelte";

  type Size = FieldBinding<number | null>;

  let {
    width,
    height,
    placeholder = "",
    onpreview = null
  }: {
    width: Size;
    height: Size;
    placeholder?: string;
    onpreview?: (() => unknown) | null;
  } = $props();

  let lockKey = $derived(`${dataTargetKey(width.target)}:${width.path.join(".")}`);
  let ratio = $derived(sizeLocks.get(lockKey) ?? null);
  let canLock = $derived(!!width.value && !!height.value);

  function toggleLock() {
    if (ratio !== null) sizeLocks.delete(lockKey);
    else if (canLock) sizeLocks.set(lockKey, width.value! / height.value!);
  }

  /** Session of the axis that follows the one being typed into, committed together with it. */
  let follower: EditSession<number | null> | null = null;

  function sizeInput(
    getSelf: () => Size,
    getOther: () => Size,
    toOther: (value: number, ratio: number) => number
  ) {
    return new FieldInput(getSelf, {
      parse: parseNumber,
      onupdate: (value) => {
        if (ratio !== null && value !== null && Number.isFinite(value)) {
          if (!follower?.active) follower = getOther().begin();
          follower.update(Math.round(toOther(value, ratio)));
        }
        onpreview?.();
      },
      oncommit: () => {
        follower?.commit();
        follower = null;
      }
    });
  }

  const widthInput = sizeInput(
    () => width,
    () => height,
    (w, r) => w / r
  );
  const heightInput = sizeInput(
    () => height,
    () => width,
    (h, r) => h * r
  );
</script>

<div class="size-field">
  <InputBox input={widthInput} type="number" prefix="W" {placeholder} suffix="px" />
  <InputBox input={heightInput} type="number" prefix="H" {placeholder} suffix="px" />
  <button
    type="button"
    class={["lock", ratio !== null && "active"]}
    disabled={!canLock && ratio === null}
    onclick={toggleLock}
    use:tippy={tooltipOptions("비율 유지")}
  >
    <Icon icon={ratio !== null ? "linked" : "unlinked"} color="#fff" size={14} />
  </button>
</div>

<style>
  .size-field {
    display: grid;
    grid-template-columns: 1fr 1fr 28px;
    gap: 6px;
    align-items: center;
  }
  .lock {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 10px;
    corner-shape: squircle;
    cursor: pointer;
    opacity: 0.6;
  }
  .lock:hover:not(:disabled) {
    opacity: 1;
    background-color: var(--w-o1);
  }
  .lock.active {
    opacity: 1;
    background-color: var(--w-o2);
  }
  .lock:disabled {
    opacity: 0.25;
    cursor: default;
  }
</style>
