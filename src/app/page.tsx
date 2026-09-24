import { mondayOf } from "../domain/week";
import { listCommitments } from "../repository/commitments";
import { getDatabase } from "../repository/db";
import { listBlocksOfWeek, requireWeek } from "../repository/weeks";
import { WeekBoard } from "./semana/WeekBoard";
import { allocateBlockAction } from "./semana/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

function weekLabel(mondayDate: string): string {
  const monday = new Date(`${mondayDate}T00:00:00Z`);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const format = (date: Date) =>
    `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

  return `Semana do dia ${format(monday)} até ${format(sunday)} de ${monday.getUTCFullYear()}`;
}

export default function Page() {
  const db = getDatabase();
  const monday = mondayOf(new Date().toISOString().slice(0, 10));
  const week = requireWeek(db, monday);

  return (
    <>
      <nav>
        <Link href="/compromissos">Gerenciar compromissos</Link>
      </nav>
      <WeekBoard
        weekLabel={weekLabel(monday)}
        commitments={listCommitments(db)}
        initialBlocks={listBlocksOfWeek(db, week.id)}
        allocate={allocateBlockAction}
      />
    </>
  );
}
