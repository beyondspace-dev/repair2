const loadProms = new Set<Promise<unknown>>();

let mounted = false;
export function registerLoad(prom: Promise<unknown>): void;
export function registerLoad(): () => void;
export function registerLoad(prom?: Promise<unknown>) {
  if (mounted) {
    console.warn("Loading promise registered but editor is already loaded");
    return;
  }
  if (!prom) {
    let resolve: (() => void) | null = null;
    loadProms.add(new Promise<void>((res) => (resolve = res)));
    return () => {
      if (!resolve) return;
      resolve();
      resolve = null;
    };
  }
  loadProms.add(prom);
}
registerLoad(document.fonts.ready);

export function editorReady(): Promise<unknown> {
  if (mounted) return Promise.resolve();
  mounted = true;
  return Promise.all([...loadProms]);
}
