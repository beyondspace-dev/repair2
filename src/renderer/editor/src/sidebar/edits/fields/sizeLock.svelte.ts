import { SvelteMap } from "svelte/reactivity";

/**
 * Aspect-ratio locks of size fields (width / height), keyed by data target.
 * UI-only: kept while the editor is open, never saved to project data.
 */
export const sizeLocks = new SvelteMap<string, number>();
