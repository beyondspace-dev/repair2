<script lang="ts" generics="T extends TextValue">
  import type { ComponentProps } from "svelte";
  import type { FieldBinding } from "../../../project/mutator";
  import InputBox from "./InputBox.svelte";
  import { FieldInput, parseText, type TextValue } from "./fieldInput.svelte";

  type BoxProps = Omit<ComponentProps<typeof InputBox<string | null>>, "input" | "type">;

  let {
    binding,
    onpreview = null,
    ...box
  }: BoxProps & {
    binding: FieldBinding<T>;
    /** Called while typing, before the value is committed. */
    onpreview?: (() => unknown) | null;
  } = $props();

  const input = new FieldInput(() => binding, {
    parse: (text) => parseText(text) as T,
    onupdate: () => onpreview?.()
  });
</script>

<InputBox {input} {...box} />
