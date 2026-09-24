import SqliteDatabase from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { MIGRATIONS_FOLDER } from "./migrationsFolder";
import * as schema from "./schema";
import type { Connected } from "./db";

export function createInMemoryDatabase(): Connected {
  const connection = new SqliteDatabase(":memory:");
  connection.pragma("foreign_keys = ON");
  const db = drizzle(connection, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { connection, db };
}
