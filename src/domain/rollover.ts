import { mondayOf, nextMonday } from "./week";

export type RolloverPlan = {
  promote: string | null;
  discard: string[];
  create: string[];
};

const NOTHING: RolloverPlan = { promote: null, discard: [], create: [] };

export function rolloverPlan(today: string, currentMonday: string): RolloverPlan {
  const todayMonday = mondayOf(today);

  if (todayMonday <= currentMonday) {
    return NOTHING;
  }

  const storedNext = nextMonday(currentMonday);

  if (todayMonday === storedNext) {
    return {
      promote: storedNext,
      discard: [currentMonday],
      create: [nextMonday(storedNext)],
    };
  }

  return {
    promote: null,
    discard: [currentMonday, storedNext],
    create: [todayMonday, nextMonday(todayMonday)],
  };
}
