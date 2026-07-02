import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const filePath = join(process.cwd(), "drizzle/0003_add_measure_target.sql");
  const content = readFileSync(filePath, "utf8");

  const statements = content
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(`${statement};`);
    console.log("OK:", statement);
  }

  console.log("Migration 0003 completed.");
}

runMigration().catch((error) => {
  console.error(error);
  process.exit(1);
});
