"use client";

import { useEffect, useRef } from "react";

type Options = {
  open: boolean;
  onDismiss: () => void;
  isInside?: (target: Element) => boolean;
};

export function useDismiss({ open, onDismiss, isInside }: Options) {
  const latest = useRef({ onDismiss, isInside });

  useEffect(() => {
    latest.current = { onDismiss, isInside };
  });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        latest.current.onDismiss();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const inside = latest.current.isInside;
      const target = event.target;
      if (inside !== undefined && target instanceof Element && !inside(target)) {
        latest.current.onDismiss();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);
}
