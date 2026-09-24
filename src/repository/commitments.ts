import { asc, count, eq } from "drizzle-orm";
import type { CommitmentInput } from "../domain/commitment";
import type { AppDatabase } from "./db";
import { blocks, commitments, type Commitment } from "./schema";

export function listCommitments(db: AppDatabase): Commitment[] {
  return db.select().from(commitments).orderBy(asc(commitments.name), asc(commitments.id)).all();
}

export function createCommitment(db: AppDatabase, input: CommitmentInput): Commitment {
  return db.insert(commitments).values(input).returning().get();
}

export function updateCommitment(
  db: AppDatabase,
  id: number,
  input: CommitmentInput,
): Commitment {
  return db.update(commitments).set(input).where(eq(commitments.id, id)).returning().get();
}

export function deleteCommitment(db: AppDatabase, id: number): void {
  db.delete(commitments).where(eq(commitments.id, id)).run();
}

export function countBlocksOf(db: AppDatabase, commitmentId: number): number {
  const result = db
    .select({ total: count() })
    .from(blocks)
    .where(eq(blocks.commitmentId, commitmentId))
    .get();

  return result?.total ?? 0;
}
