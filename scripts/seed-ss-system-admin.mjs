/**
 * Create or update S System admin (ss_system) in Supabase Auth + staff_auth.
 *
 * Usage: node scripts/seed-ss-system-admin.mjs
 *
 * Default credentials (override via env):
 *   SUNSHINE_ADMIN_EMAIL=admin@sunshines88.com
 *   SUNSHINE_ADMIN_PASSWORD=Testsystem1
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

const admin = {
  username: "admin",
  email: process.env.SUNSHINE_ADMIN_EMAIL || "admin@sunshines88.com",
  password: process.env.SUNSHINE_ADMIN_PASSWORD || "Testsystem1",
  role: "ss_system",
  name: "S System Admin",
  display_name: "Admin",
};

const restHeaders = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=representation",
};

const authHeaders = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const staffRes = await fetch(`${url}/rest/v1/staff_auth?on_conflict=username`, {
  method: "POST",
  headers: restHeaders,
  body: JSON.stringify({
    username: admin.username,
    password: admin.password,
    email: admin.email,
    role: admin.role,
    name: admin.name,
    display_name: admin.display_name,
  }),
});

if (!staffRes.ok) {
  console.error("staff_auth failed:", staffRes.status, await staffRes.text());
  process.exit(1);
}
console.log("staff_auth OK:", admin.email, `(${admin.role})`);

const lookupRes = await fetch(
  `${url}/auth/v1/admin/users?email=${encodeURIComponent(admin.email)}`,
  { headers: authHeaders },
);

let authUser = null;
if (lookupRes.ok) {
  const lookup = await lookupRes.json();
  const found = lookup?.users?.[0] ?? null;
  if (found?.email?.toLowerCase() === admin.email.toLowerCase()) {
    authUser = found;
  }
}

const authPayload = {
  email: admin.email,
  password: admin.password,
  email_confirm: true,
  user_metadata: {
    role: "ss_system",
    name: admin.name,
  },
};

if (authUser) {
  const updateRes = await fetch(`${url}/auth/v1/admin/users/${authUser.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      password: admin.password,
      email_confirm: true,
      user_metadata: authPayload.user_metadata,
    }),
  });
  if (!updateRes.ok) {
    console.error("Auth update failed:", await updateRes.text());
    process.exit(1);
  }
  console.log("Supabase Auth user updated:", admin.email);
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
  console.log("Supabase Auth user created:", admin.email);
}

console.log("\nS System login ready:");
console.log("  URL:      https://www.sunshines88.com/dashboard/login");
console.log("  Email:    " + admin.email);
console.log("  Password: " + admin.password);
