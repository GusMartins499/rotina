import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { MIGRATIONS_FOLDER } from "./migrationsFolder";
import { openDatabase } from "./db";

const { connection, db } = openDatabase();
migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
connection.close();
