/**
 * Add SUPABASE_SERVICE_ROLE_KEY to .env.local and Vercel (Production + Preview).
 *
 * Usage:
 *   node scripts/set-service-role-key.mjs "eyJhbGciOiJIUzI1NiIs..."
 *
 * Get the key from:
 *   Supabase → Project Settings → API → service_role (secret) → Reveal → Copy
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envLocalPath = join(root, ".env.local");

const key = process.argv[2]?.trim();

if (!key || key.length < 20) {
  console.error("Usage: node scripts/set-service-role-key.mjs \"<service_role_jwt>\"");
  console.error("\nGet key from:");
  console.error("  https://supabase.com/dashboard/project/bjzhmdpuzfbpkvohntjx/settings/api");
  console.error("  → Project API keys → service_role → Reveal → Copy");
  process.exit(1);
}

if (!key.startsWith("eyJ")) {
  console.error("Warning: service_role keys usually start with eyJ — double-check you copied the right key.");
}

function upsertEnvLocal() {
  const line = `SUPABASE_SERVICE_ROLE_KEY=${key}`;
  let content = "";

  if (existsSync(envLocalPath)) {
    content = readFileSync(envLocalPath, "utf8");
    if (/^SUPABASE_SERVICE_ROLE_KEY=/m.test(content)) {
      content = content.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*$/m, line);
    } else {
      content = content.trimEnd() + `\n${line}\n`;
    }
  } else {
    content = `${line}\n`;
  }

  writeFileSync(envLocalPath, content, "utf8");
  console.log("Updated .env.local");
}

function addToVercel(environment) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", "SUPABASE_SERVICE_ROLE_KEY", environment, "--yes"],
    {
      cwd: root,
      input: key,
      encoding: "utf8",
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );

  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    if (/already exists/i.test(err)) {
      console.log(`Vercel ${environment}: already exists (skip or remove first with vercel env rm)`);
      return;
    }
    console.error(`Vercel ${environment} failed:`, err || result.status);
    return;
  }
  console.log(`Vercel ${environment}: added`);
}

upsertEnvLocal();

for (const env of ["production", "preview"]) {
  addToVercel(env);
}

console.log("\nNext steps:");
console.log("  1. npm run seed:sunshinetest");
console.log("  2. npx vercel --prod   (redeploy with new env var)");
