import SqliteDatabase from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

const DEFAULT_DATABASE_PATH = "./data/rotina.db";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

export type Connected = {
  connection: Database;
  db: AppDatabase;
};

function databasePath(): string {
  return process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH;
}

export function openDatabase(): Connected {
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });

  const connection = new SqliteDatabase(path);
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");

  return { connection, db: drizzle(connection, { schema }) };
}

const globalForDatabase = globalThis as typeof globalThis & {
  rotinaDatabase?: Connected;
};

export function getDatabase(): AppDatabase {
  globalForDatabase.rotinaDatabase ??= openDatabase();
  return globalForDatabase.rotinaDatabase.db;
}
