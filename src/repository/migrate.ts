import { openDatabase } from "./db";
import { runMigrations } from "./runMigrations";

const { connection } = openDatabase();
runMigrations(connection);
connection.close();
