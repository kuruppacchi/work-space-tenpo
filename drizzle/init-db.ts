import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";

async function initDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const filePath = join(process.cwd(), "drizzle/0000_init.sql");
  const content = readFileSync(filePath, "utf8");

  const statements = content
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Running ${statements.length} SQL statements...`);

  for (const statement of statements) {
    await sql.query(`${statement};`);
  }

  console.log("Database initialized successfully.");
}

initDb().catch((error) => {
  console.error(error);
  process.exit(1);
});
