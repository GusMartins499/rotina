"use client";

import { useEffect, useRef, useState } from "react";

export type Toast = {
  state: "saving" | "saved" | "failed";
  message: string;
};

export const CONFIRMATION_MS = 1200;
export const REFUSAL_MS = 4000;

export function useSavingToast(
  saving: boolean,
  error: string | null,
  failure = 0,
): Toast | null {
  const [confirming, setConfirming] = useState(false);
  const [expiredFailure, setExpiredFailure] = useState<number | null>(null);
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

  useEffect(() => {
    if (error === null) {
      return undefined;
    }

    const timer = setTimeout(() => setExpiredFailure(failure), REFUSAL_MS);
    return () => clearTimeout(timer);
  }, [error, failure]);

  if (error !== null && expiredFailure !== failure) {
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
