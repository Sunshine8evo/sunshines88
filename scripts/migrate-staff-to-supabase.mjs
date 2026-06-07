/**
 * Migrate legacy staff_auth rows → Supabase Auth users with shop metadata.
 *
 * Usage:
 *   node scripts/migrate-staff-to-supabase.mjs
 *   node scripts/migrate-staff-to-supabase.mjs --slug=sunshinetest
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const slugArg = process.argv.find((a) => a.startsWith("--slug="));
const filterSlug = slugArg ? slugArg.split("=")[1] : null;

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

function mapRole(role) {
  const r = String(role || "staff").toLowerCase();
  if (r === "ss_team") return "sunshine_admin";
  if (r === "reception") return "receptionist";
  if (["owner", "manager", "receptionist", "staff", "sunshine_admin"].includes(r)) return r;
  return "staff";
}

async function listTenants() {
  const res = await fetch(`${url}/rest/v1/tenants?status=eq.active&select=id,slug,owner_email`, {
    headers,
  });
  if (!res.ok) throw new Error(`tenants: ${res.status} ${await res.text()}`);
  return res.json();
}

async function listStaffAuth() {
  const res = await fetch(
    `${url}/rest/v1/staff_auth?select=username,password,email,role,name,display_name`,
    { headers },
  );
  if (!res.ok) throw new Error(`staff_auth: ${res.status} ${await res.text()}`);
  return res.json();
}

async function findAuthUserByEmail(email) {
  const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.users?.[0] ?? null;
}

async function createAuthUser({ email, password, metadata }) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

async function updateAuthUser(id, { password, metadata }) {
  const res = await fetch(`${url}/auth/v1/admin/users/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      password,
      user_metadata: metadata,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

const tenants = await listTenants();
const staffRows = await listStaffAuth();

const tenantByOwnerEmail = new Map(
  tenants.map((t) => [String(t.owner_email).toLowerCase(), t]),
);

let created = 0;
let updated = 0;
let skipped = 0;

for (const row of staffRows) {
  const email = String(row.email || "").trim().toLowerCase();
  if (!email) {
    console.warn(`Skip ${row.username}: no email`);
    skipped++;
    continue;
  }

  const role = mapRole(row.role);
  let tenant = tenantByOwnerEmail.get(email);

  if (!tenant && filterSlug) {
    tenant = tenants.find((t) => t.slug === filterSlug) ?? null;
  }

  const metadata = {
    role,
    name: row.name || row.display_name || row.username,
  };

  if (role === "sunshine_admin") {
    metadata.slug = undefined;
    metadata.tenant_id = undefined;
  } else if (tenant) {
    metadata.role = role === "staff" && row.role === "owner" ? "owner" : role;
    metadata.tenant_id = tenant.id;
    metadata.slug = tenant.slug;
    if (filterSlug && tenant.slug !== filterSlug) {
      skipped++;
      continue;
    }
  } else {
    console.warn(`Skip ${row.username}: no matching tenant for ${email}`);
    skipped++;
    continue;
  }

  const existing = await findAuthUserByEmail(email);
  try {
    if (existing) {
      await updateAuthUser(existing.id, {
        password: row.password,
        metadata,
      });
      console.log(`Updated: ${email} → ${metadata.slug ?? "sunshine_admin"}`);
      updated++;
    } else {
      await createAuthUser({
        email,
        password: row.password,
        metadata,
      });
      console.log(`Created: ${email} → ${metadata.slug ?? "sunshine_admin"}`);
      created++;
    }
  } catch (err) {
    console.error(`Failed ${email}:`, err.message || err);
  }
}

console.log(`\nDone. created=${created} updated=${updated} skipped=${skipped}`);
console.log("Shop users can now sign in at /dashboard-[slug]/login with their email.");
