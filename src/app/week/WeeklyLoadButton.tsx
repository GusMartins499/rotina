"use client";

import { useEffect, useRef, useState } from "react";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";

type Props = {
  commitments: Commitment[];
  blocks: PlacedBlock[];
};

export function WeeklyLoadButton({ commitments, blocks }: Props) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && anchor.current?.contains(target) === false) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

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
