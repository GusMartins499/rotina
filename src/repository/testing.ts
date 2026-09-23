import SqliteDatabase from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { applyMigrations } from "./migrations.js";

export function createInMemoryDatabase(): Database {
  const db = new SqliteDatabase(":memory:");
  db.pragma("foreign_keys = ON");
  applyMigrations(db);
  return db;
}
