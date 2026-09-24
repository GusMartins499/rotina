import { durationOf } from "./hours";

export type LoadBlock = {
  commitmentId: number;
  weekday: number;
  startHour: number;
  endHour: number;
};

export type Remainder =
  | { kind: "missing"; hours: number }
  | { kind: "met" }
  | { kind: "exceeded"; hours: number };

type Target = { id: number; dailyHours: number | null };

export function remainingFor(
  commitment: Target,
  weekday: number,
  blocks: LoadBlock[],
): Remainder | null {
  if (commitment.dailyHours === null) {
    return null;
  }

  const allocated = blocks
    .filter((block) => block.commitmentId === commitment.id && block.weekday === weekday)
    .reduce((total, block) => total + durationOf(block), 0);

  const difference = commitment.dailyHours - allocated;

  if (difference > 0) {
    return { kind: "missing", hours: difference };
  }
  if (difference < 0) {
    return { kind: "exceeded", hours: -difference };
  }
  return { kind: "met" };
}

export function weeklyLoadFor(commitment: Target, blocks: LoadBlock[]): number {
  return blocks
    .filter((block) => block.commitmentId === commitment.id)
    .reduce((total, block) => total + durationOf(block), 0);
}
