/**
 * Seed tenant sunshinetest + Supabase Auth owner (sunshines1@sunshines88.com / Bowvy)
 * Usage: node scripts/seed-sunshinetest.mjs
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
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=representation",
};

const tenant = {
  slug: "sunshinetest",
  shop_name: "Sunshine Test",
  owner_name: "Sunshines1",
  owner_email: "sunshines1@sunshines88.com",
  plan: "trial",
  status: "active",
};

const tenantRes = await fetch(`${url}/rest/v1/tenants?on_conflict=slug`, {
  method: "POST",
  headers,
  body: JSON.stringify(tenant),
});

const tenantJson = await tenantRes.json();
if (!tenantRes.ok) {
  console.error("Tenant failed:", tenantRes.status, tenantJson);
  process.exit(1);
}

const tenantRow = Array.isArray(tenantJson) ? tenantJson[0] : tenantJson;
console.log("Tenant OK:", tenantRow.slug, tenantRow.id);

const staff = {
  username: "sunshines1",
  password: "Bowvy",
  email: "sunshines1@sunshines88.com",
  role: "owner",
  name: "Sunshine Test Owner",
  display_name: "Sunshines1",
};

const staffRes = await fetch(`${url}/rest/v1/staff_auth?on_conflict=username`, {
  method: "POST",
  headers,
  body: JSON.stringify(staff),
});

if (!staffRes.ok) {
  console.error("staff_auth failed:", staffRes.status, await staffRes.text());
  process.exit(1);
}

console.log("staff_auth OK (legacy calendar)");

const authHeaders = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const lookupRes = await fetch(
  `${url}/auth/v1/admin/users?email=${encodeURIComponent(staff.email)}`,
  { headers: authHeaders },
);

let authUser = null;
if (lookupRes.ok) {
  const lookup = await lookupRes.json();
  authUser = lookup?.users?.[0] ?? null;
}

const authPayload = {
  email: staff.email,
  password: staff.password,
  email_confirm: true,
  user_metadata: {
    role: "owner",
    tenant_id: tenantRow.id,
    slug: tenantRow.slug,
    name: staff.name,
  },
};

if (authUser) {
  const updateRes = await fetch(`${url}/auth/v1/admin/users/${authUser.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      password: staff.password,
      user_metadata: authPayload.user_metadata,
    }),
  });
  if (!updateRes.ok) {
    console.error("Auth update failed:", await updateRes.text());
    process.exit(1);
  }
  console.log("Supabase Auth user updated:", staff.email);
} else {
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(authPayload),
  });
  if (!createRes.ok) {
    console.error("Auth create failed:", await createRes.text());
    process.exit(1);
  }
  console.log("Supabase Auth user created:", staff.email);
}

console.log("\nReady:");
console.log("  Booking:  https://www.sunshines88.com/book/sunshinetest");
console.log("  Login:    https://www.sunshines88.com/dashboard-sunshinetest/login");
console.log("  Email:    sunshines1@sunshines88.com");
console.log("  Password: Bowvy");
