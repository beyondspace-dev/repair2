import type { EditSession, FieldBinding } from "../../../project/mutator";
import { getMutator } from "../../../project/store";

export type FieldInputOptions<T> = {
  parse: (text: string) => T;
  format?: (value: T) => string;
  /** Called after every keystroke with the parsed value (inside the edit session). */
  onupdate?: (value: T) => unknown;
  /** Called in the same transaction as the commit, so extra commits undo together. */
  oncommit?: () => unknown;
};

/**
 * Text-like input bound to a field through an edit session:
 * focus begins, input updates transiently, blur commits one history item.
 * While focused, outside changes don't overwrite what the user is typing.
 * Must be created during component initialisation.
 */
export class FieldInput<T> {
  text = $state("");
  #focused = false;
  #session: EditSession<T> | null = null;

  constructor(
    private readonly getBinding: () => FieldBinding<T>,
    private readonly options: FieldInputOptions<T>
  ) {
    this.text = this.#format(getBinding().value);
    $effect(() => {
      const next = this.#format(getBinding().value);
      if (!this.#focused && this.text !== next) this.text = next;
    });
  }

  #format(value: T) {
    return this.options.format ? this.options.format(value) : value == null ? "" : String(value);
  }

  onfocus = () => {
    this.#focused = true;
    this.#session = this.getBinding().begin();
  };

  oninput = () => {
    if (!this.#session?.active) this.#session = this.getBinding().begin();
    // `bind:value` on a number input yields a number (or null when empty), not a string.
    const raw = this.text as string | number | null;
    const value = this.options.parse(raw == null ? "" : String(raw));
    this.#session.update(value);
    this.options.onupdate?.(value);
  };

  onblur = () => {
    const session = this.#session;
    this.#session = null;
    this.#focused = false;
    getMutator().transaction(() => {
      session?.commit();
      this.options.oncommit?.();
    });
  };
}

/** Values editable as text. Numbers of JSON fields are shown as text and saved back as strings. */
export type TextValue = string | number | null;

export const parseText = (text: string) => text;
export const parseNumber = (text: string) => (text.trim() === "" ? null : Number(text));
