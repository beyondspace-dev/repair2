const stack: symbol[] = [];

export function pushModalLayer() {
  const layer = Symbol("modal-layer");
  stack.push(layer);

  return {
    isTop: () => stack.at(-1) === layer,
    remove: () => {
      const idx = stack.indexOf(layer);
      if (idx !== -1) stack.splice(idx, 1);
    }
  };
}
