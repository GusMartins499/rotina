import { timeLabel } from "./time";

export const WEEKDAY_NAMES = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo",
] as const;

export type Placement = {
  weekday: number;
  startMinute: number;
  endMinute: number;
};

export const REFUSAL = {
  overlap: "Esse horário já está ocupado.",
  "out-of-day": "O compromisso não cabe nesse horário.",
  empty: "Um bloco precisa ter pelo menos meia hora.",
} as const;

export function describePlacement(placement: Placement): string {
  return `${WEEKDAY_NAMES[placement.weekday]}, ${timeLabel(placement.startMinute)} às ${timeLabel(placement.endMinute)}`;
}

export function announceMove(name: string, placement: Placement): string {
  return `${name} movido para ${describePlacement(placement)}.`;
}

export function announceResize(name: string, placement: Placement): string {
  return `${name} redimensionado para ${describePlacement(placement)}.`;
}

export function announceRemoval(name: string, placement: Placement): string {
  return `${name} removido de ${describePlacement(placement)}.`;
}

export function announceRefusal(reason: keyof typeof REFUSAL): string {
  return REFUSAL[reason];
}
