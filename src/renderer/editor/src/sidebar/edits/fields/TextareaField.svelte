<script lang="ts" generics="T extends TextValue">
  import type { ComponentProps } from "svelte";
  import type { FieldBinding } from "../../../project/mutator";
  import InputBox from "./InputBox.svelte";
  import { FieldInput, parseText, type TextValue } from "./fieldInput.svelte";

  type BoxProps = Omit<
    ComponentProps<typeof InputBox<string | null>>,
    "input" | "type" | "multiline"
  >;

  let {
    binding,
    onpreview = null,
    ...box
  }: BoxProps & {
    binding: FieldBinding<T>;
    onpreview?: (() => unknown) | null;
  } = $props();

  const input = new FieldInput(() => binding, {
    parse: (text) => parseText(text) as T,
    onupdate: () => onpreview?.()
  });
</script>

<InputBox {input} multiline {...box} />
