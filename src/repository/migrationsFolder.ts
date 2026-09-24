import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MIGRATIONS_FOLDER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);
