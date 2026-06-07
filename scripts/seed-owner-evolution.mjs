/**
 * Create or update sunshinetest owner in Supabase Auth.
 *
 * Usage: node scripts/seed-owner-evolution.mjs
 *
 * Default credentials:
 *   evolution8sunshine@gmail.com / Testsystem1
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const owner = {
  email: process.env.OWNER_EMAIL || "evolution8sunshine@gmail.com",
  password: process.env.OWNER_PASSWORD || "Testsystem1",
  role: "owner",
  slug: "sunshinetest",
  name: "Bowvy Sitthichot",
  shop_name: "Sunshine Test",
};

const authHeaders = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const tenantRes = await fetch(
  `${url}/rest/v1/tenants?slug=eq.${owner.slug}&select=id,slug,shop_name`,
  { headers: authHeaders },
);
const tenantRows = tenantRes.ok ? await tenantRes.json() : [];
const tenant = tenantRows[0];

if (!tenant) {
  console.error("Tenant sunshinetest not found. Run seed-sunshinetest.mjs first.");
  process.exit(1);
}

const lookupRes = await fetch(
  `${url}/auth/v1/admin/users?email=${encodeURIComponent(owner.email)}`,
  { headers: authHeaders },
);

let authUser = null;
if (lookupRes.ok) {
  const lookup = await lookupRes.json();
  authUser = lookup?.users?.[0] ?? null;
}

const authPayload = {
  email: owner.email,
  password: owner.password,
  email_confirm: true,
  user_metadata: {
    role: owner.role,
    slug: owner.slug,
    tenant_id: tenant.id,
    name: owner.name,
    shop_name: owner.shop_name,
  },
};

if (authUser) {
  const updateRes = await fetch(`${url}/auth/v1/admin/users/${authUser.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      password: owner.password,
      email_confirm: true,
      user_metadata: authPayload.user_metadata,
    }),
  });
  if (!updateRes.ok) {
    console.error("Auth update failed:", await updateRes.text());
    process.exit(1);
  }
  console.log("Supabase Auth user updated:", owner.email);
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
  console.log("Supabase Auth user created:", owner.email);
}

const restHeaders = {
  ...authHeaders,
  Prefer: "resolution=merge-duplicates,return=representation",
};

await fetch(`${url}/rest/v1/staff_auth?on_conflict=username`, {
  method: "POST",
  headers: restHeaders,
  body: JSON.stringify({
    username: "bowvy",
    password: owner.password,
    email: owner.email,
    role: owner.role,
    name: owner.name,
    display_name: "Bowvy",
  }),
});

console.log("\nOwner login ready:");
console.log("  URL:      https://www.sunshines88.com/login");
console.log("  Email:    " + owner.email);
console.log("  Password: " + owner.password);
console.log("  Redirect: /dashboard-sunshinetest");
