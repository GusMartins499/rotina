"use client";

import { useEffect, useRef, useState } from "react";

export type Toast = {
  state: "saving" | "saved" | "failed";
  message: string;
};

const CONFIRMATION_MS = 1200;

export function useSavingToast(saving: boolean, error: string | null): Toast | null {
  const [confirming, setConfirming] = useState(false);
  const wasSaving = useRef(saving);

  useEffect(() => {
    if (wasSaving.current && !saving) {
      setConfirming(true);
      const timer = setTimeout(() => setConfirming(false), CONFIRMATION_MS);
      wasSaving.current = saving;
      return () => clearTimeout(timer);
    }

    wasSaving.current = saving;
    return undefined;
  }, [saving]);

  if (error !== null) {
    return { state: "failed", message: error };
  }
  if (saving) {
    return { state: "saving", message: "Salvando…" };
  }
  if (confirming) {
    return { state: "saved", message: "Salvo" };
  }
  return null;
}
