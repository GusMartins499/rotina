"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";
import { useDismiss } from "./useDismiss";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";

export const HOVER_OPEN_DELAY_MS = 120;
export const HOVER_CLOSE_GRACE_MS = 200;
export const FINE_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

type Props = {
  commitments: Commitment[];
  blocks: PlacedBlock[];
};

function canHover() {
  return typeof window.matchMedia === "function" && window.matchMedia(FINE_HOVER_QUERY).matches;
}

export function WeeklyLoadButton({ commitments, blocks }: Props) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const anchor = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const open = hovered || focused || pinned;

  function clearTimer() {
    clearTimeout(timer.current);
    timer.current = undefined;
  }

  function close() {
    clearTimer();
    setHovered(false);
    setFocused(false);
    setPinned(false);
  }

  useEffect(() => clearTimer, []);

  useDismiss({
    open,
    onDismiss: close,
    isInside: (target) => anchor.current?.contains(target) === true,
  });

  function onPointerEnter() {
    if (!canHover()) {
      return;
    }
    clearTimer();
    if (!hovered) {
      timer.current = setTimeout(() => setHovered(true), HOVER_OPEN_DELAY_MS);
    }
  }

  function onPointerLeave() {
    if (!canHover()) {
      return;
    }
    clearTimer();
    if (hovered) {
      timer.current = setTimeout(() => setHovered(false), HOVER_CLOSE_GRACE_MS);
    }
  }

  function onBlur(event: FocusEvent) {
    if (!(event.relatedTarget instanceof Node && anchor.current?.contains(event.relatedTarget))) {
      setFocused(false);
    }
  }

  function onClick() {
    if (pinned) {
      close();
    } else {
      setPinned(true);
    }
  }

  return (
    <div
      className="load-anchor"
      ref={anchor}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <button
        type="button"
        className="chip"
        data-testid="weekly-load-toggle"
        aria-expanded={open}
        onClick={onClick}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
      >
        Carga semanal
      </button>
      {open && <WeeklyLoadPanel commitments={commitments} blocks={blocks} />}
    </div>
  );
}
