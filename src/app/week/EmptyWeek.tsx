"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WriteResult } from "./useAllocation";

type Props = {
  hasCommitments: boolean;
  hasTemplate: boolean;
  onApply: () => Promise<WriteResult>;
};

export function EmptyWeek({ hasCommitments, hasTemplate, onApply }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const router = useRouter();

  async function apply() {
    setError(null);
    setApplying(true);
    const result = await onApply();
    setApplying(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="empty-week" data-testid="empty-week">
      <div className="empty-week-card">
        <h2>Semana vazia</h2>
        {hasCommitments ? (
          <>
            <p className="empty-week-pointer">
              Abra Compromissos e arraste um deles para um horário da grade.
            </p>
            <p className="empty-week-touch">
              Aqui você lê a semana. Para preenchê-la, aplique a rotina base.
            </p>
            {hasTemplate ? (
              <button
                type="button"
                className="chip"
                disabled={applying}
                onClick={() => void apply()}
              >
                Preencher com a rotina base
              </button>
            ) : (
              <p className="empty-week-note" data-testid="empty-week-no-template">
                Ainda não há rotina base salva. Monte uma semana e salve-a em Configurações para
                reaproveitá-la.
              </p>
            )}
          </>
        ) : (
          <p data-testid="empty-week-no-commitment">
            Comece cadastrando um compromisso em Configurações, no ícone de engrenagem.
          </p>
        )}
        {error !== null && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
