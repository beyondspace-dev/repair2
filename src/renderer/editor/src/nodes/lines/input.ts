import { get } from "svelte/store";
import { grabbingOutput, hoverInput } from "./output";
import type { Action } from "svelte/action";

const inputNode: Action<HTMLElement, { id: string; hasInput?: boolean }> = (
  node,
  { id, hasInput = true }
) => {
  if (!id) return;
  let hasInputNow = hasInput;
  node.addEventListener("mouseenter", () => {
    if (!hasInputNow) return;
    hoverInput.set(id);
  });
  node.addEventListener("mouseleave", () => {
    if (!hasInputNow) return;
    if (get(hoverInput) === id) hoverInput.set(null);
  });

  let hovering = false;

  function updateReadyToInput(isHovering: boolean, isOutputGrabbing: boolean) {
    if (isHovering && isOutputGrabbing) node.classList.add("ready-to-input");
    else node.classList.remove("ready-to-input");
  }

  const unsubs = [
    hoverInput.subscribe((i) => {
      if ((i === id) === hovering) return;

      updateReadyToInput((hovering = i === id), get(grabbingOutput));
    }),
    grabbingOutput.subscribe((g) => {
      updateReadyToInput(hovering, g);
    })
  ];
  return {
    update({ hasInput }) {
      if (hasInput) hasInputNow = hasInput;
    },
    destroy() {
      unsubs.forEach((u) => u());
    }
  };
};

export default inputNode;
