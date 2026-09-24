import { z } from "zod";
import { HOURS_PER_DAY } from "./hours";

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
  dailyHours: z.number().int().min(1).max(HOURS_PER_DAY).nullable(),
});

export type CommitmentInput = z.infer<typeof commitmentInputSchema>;
