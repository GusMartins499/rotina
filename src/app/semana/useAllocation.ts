"use client";

import { useState } from "react";
import { planAllocation } from "../../domain/allocation";
import { planMove, planResize, type RearrangePlan } from "../../domain/rearrange";
import {
  REFUSAL,
  announceMove,
  announceRemoval,
  announceResize,
} from "../../domain/announce";
import type { Block, Commitment } from "../../repository/schema";

export type PlacedBlock = Omit<Block, "id" | "weekId"> & { id: number | null };

export type AllocateResult = { ok: true; block: Block | null } | { ok: false; error: string };
export type WriteResult = { ok: true } | { ok: false; error: string };

export type DropTarget = {
  commitmentId: number;
  weekday: number;
  startHour: number;
};

type Options = {
  initialBlocks: PlacedBlock[];
  commitments: Commitment[];
  allocate: (input: {
    commitmentId: number;
    weekday: number;
    startHour: number;
    endHour: number;
  }) => Promise<AllocateResult>;
  move?: (id: number, values: Placement) => Promise<WriteResult>;
  resize?: (id: number, values: Placement) => Promise<WriteResult>;
  remove?: (id: number) => Promise<WriteResult>;
};

import type { Placement } from "../../domain/announce";

const NOOP = async (): Promise<WriteResult> => ({ ok: true });

function signatureOf(blocks: PlacedBlock[]): string {
  return blocks
    .map((block) => `${block.commitmentId}:${block.weekday}:${block.startHour}:${block.endHour}`)
    .join("|");
}

export function useAllocation({
  initialBlocks,
  commitments,
  allocate,
  move: persistMove = NOOP,
  resize: persistResize = NOOP,
  remove: persistRemove = NOOP,
}: Options) {
  const [blocks, setBlocks] = useState<PlacedBlock[]>(initialBlocks);
  const [syncedFrom, setSyncedFrom] = useState(() => signatureOf(initialBlocks));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function refuse(reason: keyof typeof REFUSAL) {
    setError(REFUSAL[reason]);
    setAnnouncement(REFUSAL[reason]);
  }

  function nameOf(commitmentId: number): string {
    return commitments.find((candidate) => candidate.id === commitmentId)?.name ?? "Compromisso";
  }

  const signature = signatureOf(initialBlocks);
  if (syncedFrom !== signature) {
    setSyncedFrom(signature);
    setBlocks(initialBlocks);
    setError(null);
  }

  async function persist(
    optimistic: () => void,
    write: () => Promise<{ ok: true } | { ok: false; error: string }>,
  ) {
    const snapshot = blocks;

    optimistic();
    setSaving(true);
    const result = await write();
    setSaving(false);

    if (!result.ok) {
      setBlocks(snapshot);
      setError(result.error);
    }
  }

  function replace(target: PlacedBlock, values: Placement) {
    setBlocks((current) =>
      current.map((block) => (block === target ? { ...block, ...values } : block)),
    );
  }

  async function rearrange(
    target: PlacedBlock,
    plan: RearrangePlan,
    write: typeof persistMove,
    announce: (name: string, placement: Placement) => string,
  ) {
    setError(null);

    if (!plan.ok) {
      refuse(plan.reason);
      return;
    }

    const after: Placement = {
      weekday: plan.weekday,
      startHour: plan.startHour,
      endHour: plan.endHour,
    };

    await persist(
      () => replace(target, after),
      () => (target.id === null ? NOOP() : write(target.id, after)),
    );

    setAnnouncement(announce(nameOf(target.commitmentId), after));
  }

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
      refuse(plan.reason);
      return;
    }

    const optimistic: PlacedBlock = {
      id: null,
      commitmentId: target.commitmentId,
      weekday: target.weekday,
      startHour: plan.startHour,
      endHour: plan.endHour,
    };

    await persist(
      () => setBlocks((current) => [...current, optimistic]),
      async () => {
        const result = await allocate({
          commitmentId: target.commitmentId,
          weekday: target.weekday,
          startHour: plan.startHour,
          endHour: plan.endHour,
        });

        if (result.ok && result.block !== null) {
          const stored = result.block;
          setBlocks((current) =>
            current.map((block) =>
              block === optimistic ? { ...optimistic, id: stored.id } : block,
            ),
          );
        }

        return result;
      },
    );
  }

  return {
    blocks,
    saving,
    error,
    announcement,
    allocate: place,
    move: (target: PlacedBlock, to: { weekday: number; startHour: number }) =>
      rearrange(target, planMove(target, to, blocks), persistMove, announceMove),
    resize: (target: PlacedBlock, endHour: number) =>
      rearrange(target, planResize(target, endHour, blocks), persistResize, announceResize),
    remove: async (target: PlacedBlock) => {
      setError(null);
      await persist(
        () => setBlocks((current) => current.filter((block) => block !== target)),
        () => (target.id === null ? NOOP() : persistRemove(target.id)),
      );
      setAnnouncement(announceRemoval(nameOf(target.commitmentId), target));
    },
  };
}
