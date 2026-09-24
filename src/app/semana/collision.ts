import { closestCenter, pointerWithin, type CollisionDetection } from "@dnd-kit/core";

export const withinGrid: CollisionDetection = (args) => {
  const pointed = pointerWithin(args);

  return pointed.length === 0 ? [] : closestCenter(args);
};
