<script lang="ts">
  import type { ComponentProps } from "svelte";
  import type { FieldBinding } from "../../../project/mutator";
  import InputBox from "./InputBox.svelte";
  import { FieldInput, parseNumber } from "./fieldInput.svelte";

  type BoxProps = Omit<
    ComponentProps<typeof InputBox<number | null>>,
    "input" | "type" | "multiline" | "code"
  >;
  /** A non-nullable field needs the value committed when the input is cleared. */
  type BindingProps =
    | { binding: FieldBinding<number | null>; fallback?: number | null }
    | { binding: FieldBinding<number>; fallback: number };

  let {
    binding,
    fallback = null,
    onpreview = null,
    ...box
  }: BoxProps &
    BindingProps & {
      onpreview?: (() => unknown) | null;
    } = $props();

  const input = new FieldInput(() => binding as FieldBinding<number | null>, {
    parse: (text) => parseNumber(text) ?? fallback,
    onupdate: () => onpreview?.()
  });
</script>

<InputBox {input} type="number" {...box} />
