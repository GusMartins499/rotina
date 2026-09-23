import { applyMigrations } from "./migrations.js";
import { openDatabase } from "./db.js";

const { connection } = openDatabase();
applyMigrations(connection);
connection.close();
