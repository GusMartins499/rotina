import SqliteDatabase from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema.js";

const DEFAULT_DATABASE_PATH = "./data/rotina.db";

function databasePath(): string {
  return process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH;
}

export function openDatabase() {
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });

  const connection = new SqliteDatabase(path);
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");

  return { connection, db: drizzle(connection, { schema }) };
}
