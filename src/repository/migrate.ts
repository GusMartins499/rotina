import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { MIGRATIONS_FOLDER } from "./migrationsFolder.js";
import { openDatabase } from "./db.js";

const { connection, db } = openDatabase();
migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
connection.close();
