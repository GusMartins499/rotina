"use client";

import { useState } from "react";
import { planAllocation } from "../../domain/allocation";
import type { Block, Commitment } from "../../repository/schema";

export type PlacedBlock = Omit<Block, "id" | "weekId"> & { id: number | null };

export type AllocateResult = { ok: true; block: Block | null } | { ok: false; error: string };

type Options = {
  initialBlocks: PlacedBlock[];
  commitments: Commitment[];
  allocate: (input: {
    commitmentId: number;
    weekday: number;
    startHour: number;
    endHour: number;
  }) => Promise<AllocateResult>;
};

export type DropTarget = {
  commitmentId: number;
  weekday: number;
  startHour: number;
};

const REFUSAL = {
  overlap: "Esse horário já está ocupado.",
  "out-of-day": "O compromisso não cabe nesse horário.",
} as const;

export function useAllocation({ initialBlocks, commitments, allocate }: Options) {
  const [blocks, setBlocks] = useState<PlacedBlock[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function place(target: DropTarget) {
    setError(null);

    const commitment = commitments.find((candidate) => candidate.id === target.commitmentId);
    if (commitment === undefined) {
      return;
    }

    const plan = planAllocation({
      commitment,
      weekday: target.weekday,
      startHour: target.startHour,
      existing: blocks,
    });

    if (!plan.ok) {
      setError(REFUSAL[plan.reason]);
      return;
    }

    const optimistic: PlacedBlock = {
      id: null,
      commitmentId: target.commitmentId,
      weekday: target.weekday,
      startHour: plan.startHour,
      endHour: plan.endHour,
    };

    setBlocks((current) => [...current, optimistic]);
    setSaving(true);

    const result = await allocate({
      commitmentId: target.commitmentId,
      weekday: target.weekday,
      startHour: plan.startHour,
      endHour: plan.endHour,
    });

    setSaving(false);

    if (!result.ok) {
      setBlocks((current) => current.filter((block) => block !== optimistic));
      setError(result.error);
      return;
    }

    if (result.block !== null) {
      setBlocks((current) =>
        current.map((block) => (block === optimistic ? { ...optimistic, id: result.block!.id } : block)),
      );
    }
  }

  return { blocks, saving, error, allocate: place };
}
