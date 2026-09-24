import Link from "next/link";
import { mondayOf } from "../domain/week";
import { listCommitments } from "../repository/commitments";
import { getDatabase } from "../repository/db";
import { applyRollover } from "../repository/rollover";
import { ensureWeekPair, listBlocksOfWeek } from "../repository/weeks";
import { WeekBoard } from "./semana/WeekBoard";
import { WeekSwitcher } from "./semana/WeekSwitcher";
import {
  allocateBlockAction,
  applyTemplateAction,
  moveBlockAction,
  removeBlockAction,
  saveTemplateAction,
} from "./semana/actions";

export const dynamic = "force-dynamic";

function weekLabel(mondayDate: string): string {
  const monday = new Date(`${mondayDate}T00:00:00Z`);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const format = (date: Date) =>
    `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

  return `Semana do dia ${format(monday)} até ${format(sunday)} de ${monday.getUTCFullYear()}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const focus = (await searchParams).semana === "proxima" ? "next" : "current";

  const db = getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  applyRollover(db, today);

  const pair = ensureWeekPair(db, mondayOf(today));
  const week = focus === "next" ? pair.next : pair.current;
  const blocks = listBlocksOfWeek(db, week.id);

  return (
    <>
      <nav>
        <Link href="/compromissos">Gerenciar compromissos</Link>
      </nav>
      <WeekSwitcher focus={focus} />
      <WeekBoard
        weekLabel={weekLabel(week.mondayDate)}
        focus={focus}
        commitments={listCommitments(db)}
        initialBlocks={blocks}
        allocate={allocateBlockAction}
        move={moveBlockAction}
        resize={moveBlockAction}
        remove={removeBlockAction}
        saveTemplate={saveTemplateAction}
        applyTemplate={applyTemplateAction}
      />
    </>
  );
}
