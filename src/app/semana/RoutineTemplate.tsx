"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WriteResult } from "./useAllocation";

type Props = {
  onSave: () => Promise<WriteResult>;
  onApply: () => Promise<WriteResult>;
  canApply: boolean;
};

export function RoutineTemplate({ onSave, onApply, canApply }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function run(action: () => Promise<WriteResult>, refreshes: boolean) {
    setError(null);
    setSaved(false);
    const result = await action();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (refreshes) {
      router.refresh();
      return;
    }

    setSaved(true);
  }

  return (
    <section className="routine-template">
      <h2>Rotina base</h2>
      <button type="button" onClick={() => void run(onSave, false)}>
        Salvar como rotina base
      </button>
      <button type="button" disabled={!canApply} onClick={() => void run(onApply, true)}>
        Aplicar rotina base
      </button>
      {!canApply && (
        <p data-testid="template-hint">
          A rotina base só pode ser aplicada numa semana vazia.
        </p>
      )}
      {saved && <p data-testid="template-saved">Rotina base salva.</p>}
      {error !== null && <p role="alert">{error}</p>}
    </section>
  );
}
