/**
 * Run supabase-stripe-billing.sql on a Supabase project.
 *
 * Usage:
 *   node scripts/run-stripe-billing-sql.mjs
 *   node scripts/run-stripe-billing-sql.mjs --project=8nvvtwi
 *   $env:SUPABASE_DB_PASSWORD="..."; node scripts/run-stripe-billing-sql.mjs --project=8nvvtwi
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/run-stripe-billing-sql.mjs --project=8nvvtwi
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL = readFileSync(join(__dirname, "..", "supabase-stripe-billing.sql"), "utf8");

function projectRefFromArgs() {
  const arg = process.argv.find((a) => a.startsWith("--project="));
  if (arg) return arg.split("=").slice(1).join("=");
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return m?.[1] ?? "bjzhmdpuzfbpkvohntjx";
}

function getPgConnectionString(projectRef) {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password =
    process.env.SUPABASE_DB_PASSWORD ||
    (process.argv.find((a) => a.startsWith("--db-password="))?.split("=").slice(1).join("=") ?? null);
  if (!password) return null;
  const host = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
  const port = process.env.SUPABASE_DB_PORT || "5432";
  const user = process.env.SUPABASE_DB_USER || "postgres";
  const database = process.env.SUPABASE_DB_NAME || "postgres";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

async function runViaPg(projectRef) {
  const connStr = getPgConnectionString(projectRef);
  if (!connStr) return false;
  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(SQL);
    console.log(`✅ supabase-stripe-billing.sql applied on project ${projectRef}`);
    return true;
  } finally {
    await client.end();
  }
}

async function runViaManagementApi(projectRef) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
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
  console.log(`✅ supabase-stripe-billing.sql applied via API on project ${projectRef}`);
  return true;
}

async function main() {
  const projectRef = projectRefFromArgs();
  console.log(`Target Supabase project: ${projectRef}`);
  if (await runViaPg(projectRef)) return;
  if (await runViaManagementApi(projectRef)) return;
  console.error(
    "Could not run SQL. Set SUPABASE_DB_PASSWORD or SUPABASE_ACCESS_TOKEN, then retry.\n" +
      `Example: $env:SUPABASE_DB_PASSWORD=\"your-password\"; node scripts/run-stripe-billing-sql.mjs --project=${projectRef}`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
