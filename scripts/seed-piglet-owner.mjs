/**
 * Seed owner account piglet / 2810 into staff_auth.
 * Usage: node scripts/seed-piglet-owner.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * (or set in shell). Uses public INSERT policy on staff_auth.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
  process.exit(1);
}

const row = {
  username: "piglet",
  password: "2810",
  email: "piglet@sunshines88.com",
  role: "owner",
  name: "Piglet",
  display_name: "Piglet",
};

const res = await fetch(`${url}/rest/v1/staff_auth`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify(row),
});

const text = await res.text();
if (!res.ok) {
  console.error("Failed:", res.status, text);
  process.exit(1);
}

console.log("OK — staff_auth upserted piglet (owner). Login: Piglet / 2810");
