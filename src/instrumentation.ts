export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { migrateDatabase } = await import("./repository/migrateDatabase");
  try {
    migrateDatabase();
    console.info("[migrate] database schema is up to date");
  } catch (error) {
    console.error("[migrate] failed to apply migrations on startup", error);
    process.exit(1);
  }
}
