import { hourLabel } from "./hours";

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
  startHour: number;
  endHour: number;
};

export const REFUSAL = {
  overlap: "Esse horário já está ocupado.",
  "out-of-day": "O compromisso não cabe nesse horário.",
  empty: "Um bloco precisa ter pelo menos uma hora.",
} as const;

export function describePlacement(placement: Placement): string {
  return `${WEEKDAY_NAMES[placement.weekday]}, ${hourLabel(placement.startHour)} às ${hourLabel(placement.endHour)}`;
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
