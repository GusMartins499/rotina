"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";

export const HOVER_OPEN_DELAY_MS = 120;
export const HOVER_CLOSE_GRACE_MS = 200;
export const FINE_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

type Options = {
  isInside: (target: Node) => boolean;
  suspended?: boolean;
};

function canHover() {
  return typeof window.matchMedia === "function" && window.matchMedia(FINE_HOVER_QUERY).matches;
}

export function useHoverDisclosure({ isInside, suspended = false }: Options) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const open = hovered || focused || pinned;

  function clearTimer() {
    clearTimeout(timer.current);
    timer.current = undefined;
  }

  const close = useCallback(() => {
    clearTimer();
    setHovered(false);
    setFocused(false);
    setPinned(false);
  }, []);

  useEffect(() => clearTimer, []);

  function onPointerEnter() {
    if (suspended || !canHover()) {
      return;
    }
    clearTimer();
    if (!hovered) {
      timer.current = setTimeout(() => setHovered(true), HOVER_OPEN_DELAY_MS);
    }
  }

  function onPointerLeave() {
    if (suspended || !canHover()) {
      return;
    }
    clearTimer();
    if (hovered) {
      timer.current = setTimeout(() => setHovered(false), HOVER_CLOSE_GRACE_MS);
    }
  }

  function onBlur(event: FocusEvent) {
    if (!(event.relatedTarget instanceof Node && isInside(event.relatedTarget))) {
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

  return {
    open,
    close,
    triggerProps: {
      "aria-expanded": open,
      onClick,
      onFocus: () => setFocused(true),
    },
    regionProps: { onPointerEnter, onPointerLeave, onBlur },
  };
}
