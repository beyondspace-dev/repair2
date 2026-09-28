<script lang="ts">
  import type { SpecialField, StringField } from "@shared/setting/settings.types";
  import Icon from "../../../assets/icons/Icon.svelte";
  import type { SettingControlProps } from "../settingControls";

  let { field, value, onchange }: SettingControlProps<StringField | SpecialField> = $props();

  let draft = $state("");
  let focused = $state(false);
  let error = $state<string | null>(null);
  let revealed = $state(false);

  let committed = $derived(value == null ? "" : String(value));
  let stringField = $derived(field.type === "string" ? field : null);
  let secret = $derived(!!stringField?.secret);
  let disallowed = $derived(
    stringField?.allowedChars ? new RegExp(`[^${stringField.allowedChars}]`, "g") : null
  );

  $effect(() => {
    const next = committed;
    if (!focused) draft = next;
  });

  function filterText(text: string) {
    let result = stringField?.uppercase ? text.toUpperCase() : text;
    if (disallowed) result = result.replace(disallowed, "");
    return result;
  }

  function validate(text: string) {
    if (text === "") return field.nullable ? null : "값을 입력해야 합니다.";
    if (field.type === "url" && !URL.canParse(text)) return "올바른 URL 형식이 아닙니다.";
    return null;
  }

  function commit() {
    const text = draft.trim();
    error = validate(text);
    if (error) return;

    const next = text === "" ? null : text;
    if (!Object.is(next, value)) onchange(next);
  }

  function oninput(evt: Event & { currentTarget: HTMLInputElement }) {
    const target = evt.currentTarget;
    const raw = target.value;
    const caret = target.selectionStart ?? raw.length;
    const filtered = filterText(raw);

    error = null;
    draft = filtered;
    if (filtered === raw) return;

    const nextCaret = filterText(raw.slice(0, caret)).length;
    target.value = filtered;
    target.setSelectionRange(nextCaret, nextCaret);
  }

  function onkeydown(evt: KeyboardEvent) {
    if (evt.key === "Enter") {
      evt.stopPropagation();
      commit();
    } else if (evt.key === "Escape" && draft !== committed) {
      evt.stopPropagation();
      draft = committed;
      error = null;
    }
  }
</script>

<div class="text-control">
  <div class="input-row">
    <input
      type={secret && !revealed ? "password" : "text"}
      class:invalid={!!error}
      value={draft}
      maxlength={stringField?.maxLength}
      placeholder={stringField?.placeholder}
      spellcheck="false"
      autocomplete="off"
      onfocus={() => (focused = true)}
      onblur={() => {
        focused = false;
        commit();
      }}
      {oninput}
      {onkeydown}
    />
    {#if secret}
      <button
        type="button"
        class="reveal"
        onclick={() => (revealed = !revealed)}
        aria-label={revealed ? "숨기기" : "보기"}
      >
        <Icon icon={revealed ? "visible" : "invisible"} color="#fff" size={16} lineWidth={1} />
      </button>
    {/if}
  </div>
  {#if error}
    <div class="error">{error}</div>
  {/if}
</div>

<style>
  .text-control {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .input-row {
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: stretch;
  }
  input {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
  }
  input.invalid {
    border-color: var(--orange) !important;
  }
  .reveal {
    flex: 0 0 auto;
    width: 30px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: solid transparent 1px;
    background-color: var(--w-o2);
    border-radius: 10px;
    corner-shape: squircle;
    cursor: pointer;
  }
  .reveal:hover {
    border-color: var(--w-o2);
  }
  .error {
    font-size: 13px;
    color: var(--orange);
    padding-left: 3px;
  }
</style>
