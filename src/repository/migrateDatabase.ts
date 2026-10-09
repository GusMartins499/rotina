import { openDatabase } from "./db";
import { runMigrations } from "./runMigrations";

export function migrateDatabase(): void {
  const { connection } = openDatabase();
  try {
    runMigrations(connection);
  } finally {
    connection.close();
  }
}
