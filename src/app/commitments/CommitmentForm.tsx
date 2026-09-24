"use client";

import { useId, useState, type FormEvent } from "react";
import { PALETTE, commitmentInputSchema, type CommitmentInput } from "../../domain/commitment";
import { formatDuration } from "../../domain/time";
import { parseDuration } from "../../domain/duration";

export type SubmitResult = { ok: true } | { ok: false; error: string };

type Props = {
  onSubmit: (input: CommitmentInput) => Promise<SubmitResult>;
  initialValue?: CommitmentInput;
  submitLabel?: string;
};

const EMPTY: CommitmentInput = { name: "", color: PALETTE[0], dailyMinutes: null };

export function CommitmentForm({ onSubmit, initialValue, submitLabel = "Salvar" }: Props) {
  const [value, setValue] = useState<CommitmentInput>(initialValue ?? EMPTY);
  const [dailyLoadText, setDailyLoadText] = useState(
    initialValue?.dailyMinutes === undefined || initialValue?.dailyMinutes === null
      ? ""
      : formatDuration(initialValue.dailyMinutes),
  );
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const typed = dailyLoadText.trim();
    const dailyMinutes = typed === "" ? null : parseDuration(typed);

    if (typed !== "" && dailyMinutes === null) {
      setError("Use uma duração como 1h30, 2h ou 30min, em passos de 30 minutos.");
      return;
    }

    const candidate = { ...value, dailyMinutes };
    const parsed = commitmentInputSchema.safeParse(candidate);

    if (!parsed.success) {
      setError(messageFor(parsed.error.issues[0]?.path[0]));
      return;
    }

    const result = await onSubmit(parsed.data);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (initialValue === undefined) {
      setValue(EMPTY);
      setDailyLoadText("");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={`${fieldId}-name`}>Nome</label>
      <input
        id={`${fieldId}-name`}
        value={value.name}
        onChange={(event) => setValue({ ...value, name: event.target.value })}
      />

      <label htmlFor={`${fieldId}-daily-load`}>Carga diária</label>
      <input
        id={`${fieldId}-daily-load`}
        inputMode="text"
        placeholder="1h30"
        value={dailyLoadText}
        onChange={(event) => setDailyLoadText(event.target.value)}
      />

      <fieldset>
        <legend>Cor</legend>
        {PALETTE.map((color) => (
          <label key={color} style={{ backgroundColor: color }}>
            <input
              type="radio"
              name={`${fieldId}-color`}
              value={color}
              checked={value.color === color}
              onChange={() => setValue({ ...value, color })}
            />
            {color}
          </label>
        ))}
      </fieldset>

      {error !== null && <p role="alert">{error}</p>}

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

function messageFor(field: PropertyKey | undefined): string {
  if (field === "name") {
    return "Informe um nome para o compromisso.";
  }
  if (field === "dailyMinutes") {
    return "Use uma duração como 1h30, 2h ou 30min, em passos de 30 minutos.";
  }
  return "Escolha uma cor da paleta.";
}
