"use client";

import { useRef, useState } from "react";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";
import { useDismiss } from "./useDismiss";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";

type Props = {
  commitments: Commitment[];
  blocks: PlacedBlock[];
};

export function WeeklyLoadButton({ commitments, blocks }: Props) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement | null>(null);

  useDismiss({
    open,
    onDismiss: () => setOpen(false),
    isInside: (target) => anchor.current?.contains(target) === true,
  });

  return (
    <div className="load-anchor" ref={anchor}>
      <button
        type="button"
        className="chip"
        data-testid="weekly-load-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Carga semanal
      </button>
      {open && <WeeklyLoadPanel commitments={commitments} blocks={blocks} />}
    </div>
  );
}
