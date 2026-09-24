"use client";

import { useState } from "react";
import type { SubmitResult } from "./CommitmentForm";

type Props = {
  name: string;
  allocatedBlocks: number;
  onDelete: () => Promise<SubmitResult>;
};

export function DeleteCommitmentButton({ name, allocatedBlocks, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setConfirming(false);
    const result = await onDelete();
    if (!result.ok) {
      setError(result.error);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (allocatedBlocks > 0 ? setConfirming(true) : remove())}
      >
        Excluir
      </button>

      {confirming && (
        <div role="dialog" aria-label={`Excluir ${name}`}>
          <p>
            {name} está alocado em {allocatedBlocks}{" "}
            {allocatedBlocks === 1 ? "bloco" : "blocos"} da semana. Excluir o compromisso
            remove {allocatedBlocks === 1 ? "esse bloco" : "esses blocos"} também.
          </p>
          <button type="button" onClick={remove}>
            Confirmar exclusão
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </div>
      )}

      {error !== null && <p role="alert">{error}</p>}
    </>
  );
}
