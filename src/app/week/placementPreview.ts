import { allocationSpan, planAllocation } from "../../domain/allocation";
import { moveSpan, planMove } from "../../domain/rearrange";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";

export type Preview = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  refused: boolean;
};

export type Dragged =
  | { kind: "commitment"; commitment: Commitment | undefined }
  | { kind: "block"; block: PlacedBlock; commitment: Commitment | undefined };

export type SlotTarget = { weekday: number; startMinute: number };

export function dropPreviewOf(
  dragged: Dragged,
  slot: SlotTarget,
  blocks: PlacedBlock[],
): Preview | null {
  if (dragged.kind === "block") {
    return {
      ...moveSpan(dragged.block, slot),
      refused: !planMove(dragged.block, slot, blocks).ok,
    };
  }

  const commitment = dragged.commitment;
  if (commitment === undefined) {
    return null;
  }

  return {
    weekday: slot.weekday,
    ...allocationSpan(commitment, slot.startMinute),
    refused: !planAllocation({ commitment, ...slot, existing: blocks }).ok,
  };
}
