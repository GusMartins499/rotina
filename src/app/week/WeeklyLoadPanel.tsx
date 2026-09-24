"use client";

import { weeklyLoadFor } from "../../domain/load";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";

type Props = {
  commitments: Commitment[];
  blocks: PlacedBlock[];
};

export function WeeklyLoadPanel({ commitments, blocks }: Props) {
  return (
    <section className="weekly-load">
      <h2>Carga semanal</h2>
      <ul>
        {commitments.map((commitment) => (
          <li key={commitment.id} data-testid={`weekly-load-${commitment.id}`}>
            <span>{commitment.name}</span>
            <strong>{weeklyLoadFor(commitment, blocks)}h</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
