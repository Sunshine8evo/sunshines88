/**
 * Run supabase-run-all.sql against the Sunshines88 Supabase project.
 *
 * Option A — database password:
 *   $env:SUPABASE_DB_PASSWORD="your-db-password"; node scripts/run-supabase-migrations.mjs
 *
 * Option B — Supabase personal access token:
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/run-supabase-migrations.mjs
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "bjzhmdpuzfbpkvohntjx";
const SQL = [
  readFileSync(join(__dirname, "..", "supabase-run-all.sql"), "utf8"),
  readFileSync(join(__dirname, "..", "supabase-settings-extras.sql"), "utf8"),
  readFileSync(join(__dirname, "..", "supabase-catalog-settings.sql"), "utf8"),
  readFileSync(join(__dirname, "..", "supabase-team-auth.sql"), "utf8"),
].join("\n\n");

function getPgConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password =
    process.env.SUPABASE_DB_PASSWORD ||
    (process.argv.find((a) => a.startsWith("--db-password="))?.split("=").slice(1).join("=") ?? null);
  if (!password) return null;
  const host = process.env.SUPABASE_DB_HOST || `db.${PROJECT_REF}.supabase.co`;
  const port = process.env.SUPABASE_DB_PORT || "5432";
  const user = process.env.SUPABASE_DB_USER || "postgres";
  const database = process.env.SUPABASE_DB_NAME || "postgres";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

async function runViaPg() {
  const connStr = getPgConnectionString();
  if (!connStr) return false;
  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(SQL);
    console.log("Migrations applied via PostgreSQL.");
    return true;
  } finally {
    await client.end();
  }
}

async function runViaManagementApi() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  });
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${await res.text()}`);
  }
  console.log("Migrations applied via Supabase Management API.");
  return true;
}

async function main() {
  if (await runViaPg()) return;
  if (await runViaManagementApi()) return;
  console.error("Could not run migrations. Set SUPABASE_DB_PASSWORD or SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
