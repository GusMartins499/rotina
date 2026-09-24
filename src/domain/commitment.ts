import { z } from "zod";
import { MINUTES_PER_DAY, STEP_MINUTES } from "./time";

export const PALETTE = [
  "#d73a4a",
  "#0969da",
  "#1a7f37",
  "#9a6700",
  "#8250df",
  "#bf3989",
  "#0f766e",
  "#57606a",
] as const;

export type PaletteColor = (typeof PALETTE)[number];

export const commitmentInputSchema = z.object({
  name: z.string().trim().min(1),
  color: z.enum(PALETTE),
  dailyMinutes: z
    .number()
    .int()
    .min(STEP_MINUTES)
    .max(MINUTES_PER_DAY)
    .refine((value) => value % STEP_MINUTES === 0)
    .nullable(),
});

export type CommitmentInput = z.infer<typeof commitmentInputSchema>;
