import { execFileSync } from "node:child_process";

const DATABASE_PATH = "./e2e/.data/e2e.db";

export default function globalSetup() {
  execFileSync(
    "npx",
    [
      "tsx",
      "-e",
      [
        'import { openDatabase } from "./src/repository/db";',
        'import { createCommitment } from "./src/repository/commitments";',
        "const { db } = openDatabase();",
        'createCommitment(db, { name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480 });',
        'createCommitment(db, { name: "Psicologo", color: "#8250df", dailyMinutes: null });',
      ].join("\n"),
    ],
    { env: { ...process.env, DATABASE_PATH }, stdio: "inherit" },
  );
}
