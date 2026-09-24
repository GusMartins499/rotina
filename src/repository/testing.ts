import SqliteDatabase from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { MIGRATIONS_FOLDER } from "./migrationsFolder.js";
import * as schema from "./schema.js";

export function createInMemoryDatabase(): Database {
  const connection = new SqliteDatabase(":memory:");
  connection.pragma("foreign_keys = ON");
  migrate(drizzle(connection, { schema }), { migrationsFolder: MIGRATIONS_FOLDER });
  return connection;
}
