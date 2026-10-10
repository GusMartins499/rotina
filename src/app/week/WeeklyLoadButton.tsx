"use client";

import { useRef } from "react";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";
import { useDismiss } from "./useDismiss";
import { useHoverDisclosure } from "./useHoverDisclosure";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";

export { FINE_HOVER_QUERY, HOVER_CLOSE_GRACE_MS, HOVER_OPEN_DELAY_MS } from "./useHoverDisclosure";

type Props = {
  commitments: Commitment[];
  blocks: PlacedBlock[];
};

export function WeeklyLoadButton({ commitments, blocks }: Props) {
  const anchor = useRef<HTMLDivElement | null>(null);
  const isInside = (target: Node) => anchor.current?.contains(target) === true;
  const { open, close, triggerProps, regionProps } = useHoverDisclosure({ isInside });

  useDismiss({ open, onDismiss: close, isInside });

  return (
    <div className="load-anchor" ref={anchor} {...regionProps}>
      <button type="button" className="chip" data-testid="weekly-load-toggle" {...triggerProps}>
        Carga semanal
      </button>
      {open && <WeeklyLoadPanel commitments={commitments} blocks={blocks} />}
    </div>
  );
}
