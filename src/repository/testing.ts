import SqliteDatabase from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { runMigrations } from "./runMigrations";
import type { Connected } from "./db";

export function createInMemoryDatabase(): Connected {
  const connection = new SqliteDatabase(":memory:");
  runMigrations(connection);
  return { connection, db: drizzle(connection, { schema }) };
}
