import type { Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { MIGRATIONS_FOLDER } from "./migrationsFolder";
import * as schema from "./schema";

export function runMigrations(connection: Database): void {
  connection.pragma("foreign_keys = OFF");
  migrate(drizzle(connection, { schema }), { migrationsFolder: MIGRATIONS_FOLDER });
  connection.pragma("foreign_keys = ON");
}
