import type { ReactNode } from "react";
import type { Commitment } from "../../repository/schema";

type Props = {
  commitments: Commitment[];
  renderActions?: (commitment: Commitment) => ReactNode;
};

function describeLoad(commitment: Commitment): string {
  return commitment.dailyHours === null ? "sem carga diária" : `${commitment.dailyHours}h/dia`;
}

export function CommitmentList({ commitments, renderActions }: Props) {
  if (commitments.length === 0) {
    return <p>Nenhum compromisso cadastrado ainda.</p>;
  }

  return (
    <ul>
      {commitments.map((commitment) => (
        <li key={commitment.id} aria-label={`${commitment.name}, ${describeLoad(commitment)}`}>
          <span
            data-testid={`commitment-color-${commitment.id}`}
            style={{ backgroundColor: commitment.color }}
          />
          <span>{commitment.name}</span>
          {commitment.dailyHours !== null && <span>{commitment.dailyHours}h/dia</span>}
          {renderActions?.(commitment)}
        </li>
      ))}
    </ul>
  );
}
