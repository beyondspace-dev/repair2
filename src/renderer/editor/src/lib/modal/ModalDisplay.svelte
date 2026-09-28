<script lang="ts">
  import { autofocus } from "../actions/autofocus";
  import Checkbox from "../../sidebar/input/Checkbox.svelte";
  import { closeModal, modal } from "./modal.svelte.js";
  import type { ResolveParams } from "./types";
  import Select from "../../sidebar/input/Select.svelte";
  import ModalFrame from "./ModalFrame.svelte";

  type ModalValues = NonNullable<ResolveParams["fields"]>;

  let values: ModalValues | null = $state(null);

  $effect(() => {
    if (!modal.currentModal) values = null;
    else
      values = Array.from(
        modal.currentModal.fields,
        (f) => f.value ?? (f.type === "checkbox" ? false : null)
      );
  });

  let confirmable: boolean = $derived(
    !!values &&
      !modal.currentModal?.fields?.some?.(
        ({ type, required = false }, i) => required && type !== "checkbox" && !values![i]
      )
  );

  function tryConfirm() {
    if (!confirmable || !values) return;
    closeModal({ canceled: false, fields: $state.snapshot(values) });
  }
  function cancel() {
    closeModal({ canceled: true });
  }

  function onkeydown({ key }: KeyboardEvent) {
    if (key === "Enter") tryConfirm();
  }
</script>

{#if modal.currentModal && values}
  {@const m = modal.currentModal}
  {@const buttons = m.buttons ?? [{ label: "취소" }, { label: "확인" }]}
  <ModalFrame title={m.title || null} onclose={cancel} {onkeydown}>
    <div class="body">
      {#each m.fields as f, i}
        <div
          class={["field", f.type ?? "input"]}
          onclick={f.type === "checkbox"
            ? () => {
                if (values) values[i] = !values[i];
              }
            : null}
        >
          <span class="label">{f.label}</span>
          {#if f.type === "checkbox"}
            <Checkbox value={!!values[i]} />
          {:else if f.type === "select"}
            {@const options = Array.isArray(f.options) ? f.options : Object.entries(f.options)}
            <Select
              bind:value={values[i]}
              unselectable={!f.required}
              placeholder="선택 없음"
              autofocus={f.autofocus}
              {options}
            />
          {:else}
            <input
              type="text"
              value={values[i]}
              oninput={(evt) => {
                if (!values) return;

                const target = evt.currentTarget;
                values[i] = f.filter?.(target.value) ?? target.value;
                target.value = values[i] ?? "";
              }}
              placeholder={f.placeholder}
              use:autofocus={f.autofocus}
            />
          {/if}
        </div>
      {/each}
    </div>
    {#snippet footer()}
      {#each buttons as btn, i}
        {@const isCancel = buttons.length - 1 !== i}
        <button
          class={[isCancel ? "cancel" : "confirm"]}
          disabled={!isCancel && !confirmable}
          onclick={() => {
            if (!values) return;

            const params = { canceled: isCancel, fields: $state.snapshot(values) };
            if (btn.onclick && !btn.onclick?.(params)) return;
            closeModal(params);
          }}
        >
          {btn.label}
        </button>
      {/each}
    {/snippet}
  </ModalFrame>
{/if}

<style>
  .body {
    display: flex;
    flex-direction: column;
    padding: 15px 15px 20px 15px;
    gap: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .field.checkbox {
    flex-direction: row;
    justify-content: end;
    align-items: center;
    padding-right: 5px;
    gap: 10px;
    margin-top: 10px;
  }
  .label {
    opacity: 0.8;
    font-size: 14px;
    margin-left: 3px;
  }
  button {
    padding: 3px 8px;
    font-size: 16px;
    border-radius: 10px;
    corner-shape: squircle;
    border: solid var(--w-o2) 1px;
    color: #fff;
    cursor: pointer;
  }
  button.cancel {
    opacity: 0.8;
  }
  button.cancel:hover {
    opacity: 1;
  }
  button:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }
  button.confirm {
    border-color: transparent;
    background-color: var(--blue-dark);
  }
</style>
