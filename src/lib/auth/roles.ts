export type UserRole = "ss_system" | "owner" | "staff";

export type UserMetadata = {
  role?: UserRole | string;
  tenant_id?: string;
  slug?: string;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ss_system: "S System",
  owner: "Owner",
  staff: "Staff",
};

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  ss_system: "ss_system",
  ss_team: "ss_system",
  sunshine_admin: "ss_system",
  owner: "owner",
  staff: "staff",
  manager: "staff",
  receptionist: "staff",
  reception: "staff",
  cleaner: "staff",
};

export function normalizeRole(role: string | undefined): UserRole | undefined {
  if (!role) return undefined;
  const r = role.toLowerCase().trim();
  return LEGACY_ROLE_MAP[r];
}

export function getUserMetadata(
  user: { user_metadata?: Record<string, unknown> } | null | undefined,
): UserMetadata {
  const meta = user?.user_metadata ?? {};
  const rawRole = typeof meta.role === "string" ? meta.role : undefined;
  return {
    role: normalizeRole(rawRole) ?? rawRole,
    tenant_id: typeof meta.tenant_id === "string" ? meta.tenant_id : undefined,
    slug: typeof meta.slug === "string" ? meta.slug : undefined,
  };
}

export const SUNSHINES88_EMAIL_DOMAIN = "sunshines88.com";

export const EXTERNAL_EMAIL_LOGIN_MSG =
  "Sign-in is only allowed for @sunshines88.com accounts. Please use your Sunshine company email.";

export function isSunshines88Email(email: string | undefined | null): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  return email.slice(at + 1).trim().toLowerCase() === SUNSHINES88_EMAIL_DOMAIN;
}

export function isSSSystem(role: string | undefined): boolean {
  return normalizeRole(role) === "ss_system";
}

/** SS System = any account signed in with a @sunshines88.com email. */
export function isSSSystemUser(
  user: { email?: string | null; role?: string | null } | null | undefined,
): boolean {
  if (isSunshines88Email(user?.email)) return true;
  return isSSSystem(typeof user?.role === "string" ? user.role : undefined);
}

export function isOwner(role: string | undefined): boolean {
  return normalizeRole(role) === "owner";
}

export function isStaff(role: string | undefined): boolean {
  return normalizeRole(role) === "staff";
}

export function canSeeTools(role: string | undefined): boolean {
  const r = normalizeRole(role);
  return r === "ss_system" || r === "owner";
}

export function canSeeSales(role: string | undefined): boolean {
  return canSeeTools(role);
}

export function roleLabel(role: string | undefined): string {
  const r = normalizeRole(role);
  if (r && ROLE_LABELS[r]) return ROLE_LABELS[r];
  return role ?? "User";
}

export function parseShopSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard-([^/]+)/);
  return match?.[1] ?? null;
}

export function canAccessShopDashboard(
  role: string | undefined,
  userSlug: string | undefined,
  shopSlug: string,
): boolean {
  if (isSSSystem(role)) return true;
  return Boolean(userSlug && userSlug === shopSlug);
}
