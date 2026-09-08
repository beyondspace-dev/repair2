export type ToastTypes = "normal" | "error" | "warning";

export type ShowToastOptions = (
  | {
      id: string | null;
      title?: string | null;
    }
  | {
      id?: string | null;
      title: string | null;
    }
) & {
  type?: ToastTypes;
  content?: string | null;
  /** @default 3000 */
  duration?: number | null;
  /** @default false */
  closable?: boolean | null;
};
