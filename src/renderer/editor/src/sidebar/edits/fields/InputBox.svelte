<script lang="ts" generics="T">
  import { onMount, type Snippet } from "svelte";
  import autoResizeTextarea from "../../../lib/actions/autoResizeTextarea";
  import { tippy } from "../../../lib/tippy/tippy";
  import { tooltipOptions } from "./tooltip";
  import type { FieldInput } from "./fieldInput.svelte";

  let {
    input,
    type = "text",
    multiline = false,
    code = false,
    minHeight = 50,
    placeholder = "",
    prefix = null,
    suffix = null,
    tooltip = null,
    autofocus = false,
    ...attrs
  }: {
    input: FieldInput<T>;
    type?: "text" | "number";
    multiline?: boolean;
    code?: boolean;
    minHeight?: number;
    placeholder?: string;
    /** Short label or snippet shown inside the box before the value (e.g. "W"). */
    prefix?: string | Snippet | null;
    suffix?: string | Snippet | null;
    /** Full field name, shown on hover since the field has no visible label. */
    tooltip?: string | null;
    autofocus?: boolean;
    min?: number;
    max?: number;
    maxlength?: number;
  } = $props();

  let el = $state<HTMLInputElement | HTMLTextAreaElement>();
  onMount(() => {
    if (autofocus) el?.focus();
  });
</script>

{#snippet adornment(content: string | Snippet, cls: string)}
  <span class={cls}>
    {#if typeof content === "string"}{content}{:else}{@render content()}{/if}
  </span>
{/snippet}

<label
  class={["input-box", multiline && "multiline", code && "code"]}
  use:tippy={tooltipOptions(tooltip)}
>
  {#if prefix}{@render adornment(prefix, "prefix")}{/if}
  {#if multiline}
    <textarea
      bind:this={el}
      bind:value={input.text}
      oninput={input.oninput}
      onfocus={input.onfocus}
      onblur={input.onblur}
      class:code
      {placeholder}
      spellcheck="false"
      use:autoResizeTextarea={{ minHeight }}
      {...attrs}
    ></textarea>
  {:else}
    <input
      bind:this={el}
      bind:value={input.text}
      oninput={input.oninput}
      onfocus={input.onfocus}
      onblur={input.onblur}
      {type}
      {placeholder}
      spellcheck="false"
      {...attrs}
    />
  {/if}
  {#if suffix}{@render adornment(suffix, "suffix")}{/if}
</label>

<style>
  .input-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    min-width: 0;
    width: 100%;
    height: 28px;
    padding-inline: 8px;
    box-sizing: border-box;
    background-color: var(--w-o1);
    border: solid transparent 1px;
    border-radius: 10px;
    corner-shape: squircle;
    cursor: text;
  }
  .input-box:hover {
    border-color: var(--w-o2);
  }
  .input-box:focus-within {
    border-color: var(--blue-bright);
  }
  .input-box.multiline {
    height: auto;
    align-items: start;
    padding-block: 4px;
  }
  .input-box.code {
    background-color: #2b002a;
    border-color: rgba(185, 116, 185, 0.5);
  }
  .input-box.code:hover {
    border-color: rgba(185, 116, 185, 0.8);
  }
  .input-box.code:focus-within {
    border-color: var(--blue-bright);
  }
  input,
  textarea {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    padding: 0;
    border: none;
    border-radius: 0;
    background: none;
    font-size: 14px;
  }
  textarea.code {
    font-size: 14px;
  }
  .prefix,
  .suffix {
    flex: 0 0 auto;
    font-size: 12px;
    color: var(--w-o6);
    white-space: nowrap;
  }
  .multiline .prefix,
  .multiline .suffix {
    line-height: 20px;
  }
</style>
