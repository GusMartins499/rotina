import { formatDuration } from "../../domain/time";
import type { ReactNode } from "react";
import type { Commitment } from "../../repository/schema";

type Props = {
  commitments: Commitment[];
  renderActions?: (commitment: Commitment) => ReactNode;
  renderDetail?: (commitment: Commitment) => ReactNode;
  expandedId?: number | null;
};

function describeLoad(commitment: Commitment): string {
  return commitment.dailyMinutes === null ? "sem carga diária" : `${formatDuration(commitment.dailyMinutes)}/dia`;
}

export function CommitmentList({ commitments, renderActions, renderDetail, expandedId = null }: Props) {
  if (commitments.length === 0) {
    return <p>Nenhum compromisso cadastrado ainda.</p>;
  }

  return (
    <ul className="commitment-list">
      {commitments.map((commitment) => {
        const detail = renderDetail?.(commitment);

        return (
          <li
            key={commitment.id}
            aria-label={`${commitment.name}, ${describeLoad(commitment)}`}
            className="commitment-card"
            data-expanded={expandedId === commitment.id ? "true" : undefined}
          >
            <div className="commitment-summary" data-testid={`commitment-summary-${commitment.id}`}>
              <span
                className="commitment-swatch"
                data-testid={`commitment-color-${commitment.id}`}
                style={{ backgroundColor: commitment.color }}
              />
              <span className="commitment-text">
                <span className="commitment-name">{commitment.name}</span>
                <span className="commitment-load">{describeLoad(commitment)}</span>
              </span>
              {renderActions !== undefined && (
                <span className="commitment-actions">{renderActions(commitment)}</span>
              )}
            </div>
            {detail !== undefined && detail !== null && (
              <div className="commitment-detail" data-testid={`commitment-detail-${commitment.id}`}>
                {detail}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
