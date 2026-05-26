import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turso } from "../src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../drizzle/migrations");
const legacyMigrations = new Set([
  "0000_initial_schema.sql",
  "0001_measurement_body_parts.sql",
  "0002_measurement_sides_and_height.sql",
  "0003_monthly_client_fees.sql",
]);

await turso.execute(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id text PRIMARY KEY NOT NULL,
    applied_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
`);

const usersTable = await turso.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'",
);
const existingRows = await turso.execute("SELECT id FROM schema_migrations");

if (usersTable.rows.length && existingRows.rows.length === 0) {
  for (const id of legacyMigrations) {
    await turso.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)",
      args: [id],
    });
  }
}

const appliedRows = await turso.execute("SELECT id FROM schema_migrations");
const applied = new Set(appliedRows.rows.map((row) => row.id));
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;

  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    if (!(await shouldRunStatement(statement))) continue;
    await turso.execute(statement);
  }

  await turso.execute({
    sql: "INSERT INTO schema_migrations (id) VALUES (?)",
    args: [file],
  });
  console.log(`Applied migration ${file}`);
}

console.log("Database migrations are up to date");

async function shouldRunStatement(statement) {
  const addColumnMatch = statement.match(/^ALTER TABLE [`"]?(\w+)[`"]?\s+ADD(?: COLUMN)?\s+[`"]?(\w+)[`"]?/i);
  if (!addColumnMatch) return true;

  const [, tableName, columnName] = addColumnMatch;
  const tableInfo = await turso.execute(`PRAGMA table_info(${tableName})`);
  return !tableInfo.rows.some((column) => column.name === columnName);
}
