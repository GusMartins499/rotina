"use client";

import { useState, type KeyboardEvent } from "react";
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
        onClick={() => (needsConfirmation(allocatedBlocks) ? setConfirming(true) : remove())}
      >
        Excluir
      </button>

      {confirming && (
        <DeleteConfirmation
          name={name}
          allocatedBlocks={allocatedBlocks}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      )}

      {error !== null && <p role="alert">{error}</p>}
    </>
  );
}

export function needsConfirmation(allocatedBlocks: number): boolean {
  return allocatedBlocks > 0;
}

type ConfirmationProps = {
  name: string;
  allocatedBlocks: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmation({ name, allocatedBlocks, onConfirm, onCancel }: ConfirmationProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  }

  return (
    <div
      role="dialog"
      aria-label={`Excluir ${name}`}
      className="delete-confirmation"
      onKeyDown={handleKeyDown}
    >
      <p>
        {name} está alocado em {allocatedBlocks}{" "}
        {allocatedBlocks === 1 ? "bloco" : "blocos"} da semana. Excluir o compromisso
        remove {allocatedBlocks === 1 ? "esse bloco" : "esses blocos"} também.
      </p>
      <div className="delete-confirmation-actions">
        <button type="button" onClick={onCancel} autoFocus>
          Cancelar
        </button>
        <button type="button" className="danger" onClick={onConfirm}>
          Confirmar exclusão
        </button>
      </div>
    </div>
  );
}
