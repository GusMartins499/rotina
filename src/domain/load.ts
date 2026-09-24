import { durationOf } from "./time";

export type LoadBlock = {
  commitmentId: number;
  weekday: number;
  startMinute: number;
  endMinute: number;
};

export type Remainder =
  | { kind: "missing"; minutes: number }
  | { kind: "met" }
  | { kind: "exceeded"; minutes: number };

type Target = { id: number; dailyMinutes: number | null };

export function remainingFor(
  commitment: Target,
  weekday: number,
  blocks: LoadBlock[],
): Remainder | null {
  if (commitment.dailyMinutes === null) {
    return null;
  }

  const allocated = blocks
    .filter((block) => block.commitmentId === commitment.id && block.weekday === weekday)
    .reduce((total, block) => total + durationOf(block), 0);

  const difference = commitment.dailyMinutes - allocated;

  if (difference > 0) {
    return { kind: "missing", minutes: difference };
  }
  if (difference < 0) {
    return { kind: "exceeded", minutes: -difference };
  }
  return { kind: "met" };
}

export function weeklyLoadFor(commitment: Target, blocks: LoadBlock[]): number {
  return blocks
    .filter((block) => block.commitmentId === commitment.id)
    .reduce((total, block) => total + durationOf(block), 0);
}
