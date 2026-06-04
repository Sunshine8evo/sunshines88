import { randomBytes } from "crypto";

import {
  DEFAULT_STAFF_USERS,
  type PublicStaffUser,
  type StaffUser,
  toPublicUser,
} from "./staff-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonServerClient } from "@/lib/supabase/anon-server";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbStaffAuth = {
  username: string;
  password: string;
  email: string;
  role: "owner" | "manager" | "reception" | "staff" | "ss_team";
  name: string;
  display_name: string;
};

function mapDbUser(row: DbStaffAuth): StaffUser {
  return {
    username: row.username,
    password: row.password,
    email: row.email,
    role: row.role,
    name: row.name,
    displayName: row.display_name,
  };
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const STAFF_AUTH_COLUMNS =
  "username,password,email,role,name,display_name" as const;

async function lookupStaffAuth(
  build: (
    client: SupabaseClient,
  ) => Promise<{ data: DbStaffAuth | null; error: unknown }>,
): Promise<StaffUser | null> {
  const clients: Array<() => SupabaseClient> = [
    () => createAdminClient(),
    () => createAnonServerClient(),
  ];

  for (const createClient of clients) {
    try {
      const { data, error } = await build(createClient());
      if (!error && data) {
        return mapDbUser(data);
      }
    } catch {
      // Try next client (e.g. service role missing on host).
    }
  }

  return null;
}

async function getUserByUsername(username: string): Promise<StaffUser | null> {
  const key = normalizeUsername(username);

  const fromDb = await lookupStaffAuth(async (supabase) =>
    supabase
      .from("staff_auth")
      .select(STAFF_AUTH_COLUMNS)
      .eq("username", key)
      .maybeSingle(),
  );
  if (fromDb) return fromDb;

  return DEFAULT_STAFF_USERS.find((user) => user.username === key) ?? null;
}

async function getUserByEmail(email: string): Promise<StaffUser | null> {
  const normalized = normalizeEmail(email);

  const fromDb = await lookupStaffAuth(async (supabase) =>
    supabase
      .from("staff_auth")
      .select(STAFF_AUTH_COLUMNS)
      .eq("email", normalized)
      .maybeSingle(),
  );
  if (fromDb) return fromDb;

  return DEFAULT_STAFF_USERS.find((user) => user.email === normalized) ?? null;
}

async function upsertStaffUser(user: StaffUser): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("staff_auth").upsert(
    {
      username: user.username,
      password: user.password,
      email: user.email,
      role: user.role,
      name: user.name,
      display_name: user.displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "username" },
  );

  if (error) throw error;
}

export async function loginStaff(
  username: string,
  password: string,
): Promise<PublicStaffUser | null> {
  const user = await getUserByUsername(username);
  if (!user || String(user.password) !== String(password)) return null;
  const publicUser = toPublicUser(user);
  if (username.trim().toLowerCase().startsWith("sunshines")) {
    publicUser.role = "ss_team";
    publicUser.displayName = username.trim();
    publicUser.name = username.trim();
  }
  return publicUser;
}

export async function createPasswordResetToken(
  email: string,
): Promise<{ token: string; user: StaffUser } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("password_reset_tokens").insert({
      email: user.email,
      token,
      expires_at: expiresAt,
    });

    if (error) throw error;
  } catch (cause) {
    console.error("createPasswordResetToken:", cause);
    return null;
  }

  return { token, user };
}

export async function resetStaffPassword(
  token: string,
  newPassword: string,
): Promise<boolean> {
  if (!newPassword || newPassword.length < 4) return false;

  let email: string | null = null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .select("email,expires_at,used_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !data || data.used_at) return false;
    if (new Date(data.expires_at).getTime() < Date.now()) return false;

    email = data.email;
    if (!email) return false;

    const user = await getUserByEmail(email);
    if (!user) return false;

    await upsertStaffUser({ ...user, password: newPassword });

    await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    return true;
  } catch {
    return false;
  }
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.sunshines88.com"
  );
}
