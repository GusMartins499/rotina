import type { CommitmentInput } from "../../domain/commitment";
import { getDatabase } from "../../repository/db";
import { countBlocksOf, listCommitments } from "../../repository/commitments";
import { CommitmentList } from "./CommitmentList";
import { NewCommitment } from "./NewCommitment";
import { DeleteCommitment } from "./DeleteCommitment";
import { EditCommitment } from "./EditCommitment";

export const dynamic = "force-dynamic";

export default function CompromissosPage() {
  const db = getDatabase();
  const commitments = listCommitments(db);
  const allocatedBlocks = new Map(
    commitments.map((commitment) => [commitment.id, countBlocksOf(db, commitment.id)]),
  );

  return (
    <main>
      <h1>Compromissos</h1>
      <NewCommitment />
      <CommitmentList
        commitments={commitments}
        renderActions={(commitment) => (
          <>
            <EditCommitment
              id={commitment.id}
              value={{
                name: commitment.name,
                color: commitment.color as CommitmentInput["color"],
                dailyMinutes: commitment.dailyMinutes,
              }}
            />
            <DeleteCommitment
              id={commitment.id}
              name={commitment.name}
              allocatedBlocks={allocatedBlocks.get(commitment.id) ?? 0}
            />
          </>
        )}
      />
    </main>
  );
}
