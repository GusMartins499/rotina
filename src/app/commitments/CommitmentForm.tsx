"use client";

import { useId, useState, type FormEvent } from "react";
import { PALETTE, commitmentInputSchema, type CommitmentInput } from "../../domain/commitment";
import { MINUTES_PER_HOUR } from "../../domain/time";

export type SubmitResult = { ok: true } | { ok: false; error: string };

type Props = {
  onSubmit: (input: CommitmentInput) => Promise<SubmitResult>;
  initialValue?: CommitmentInput;
  submitLabel?: string;
};

const EMPTY: CommitmentInput = { name: "", color: PALETTE[0], dailyMinutes: null };

export function CommitmentForm({ onSubmit, initialValue, submitLabel = "Salvar" }: Props) {
  const [value, setValue] = useState<CommitmentInput>(initialValue ?? EMPTY);
  const [dailyHoursText, setDailyHoursText] = useState(
    initialValue?.dailyMinutes === undefined || initialValue?.dailyMinutes === null
      ? ""
      : String(initialValue.dailyMinutes / MINUTES_PER_HOUR),
  );
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const candidate = {
      ...value,
      dailyMinutes:
        dailyHoursText.trim() === "" ? null : Number(dailyHoursText) * MINUTES_PER_HOUR,
    };
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
      setDailyHoursText("");
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

      <label htmlFor={`${fieldId}-daily-hours`}>Carga diária (horas)</label>
      <input
        id={`${fieldId}-daily-hours`}
        inputMode="numeric"
        value={dailyHoursText}
        onChange={(event) => setDailyHoursText(event.target.value)}
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
    return "A carga diária precisa ser um número inteiro entre 1 e 17 horas.";
  }
  return "Escolha uma cor da paleta.";
}
