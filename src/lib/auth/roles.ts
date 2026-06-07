export type UserRole =
  | "sunshine_admin"
  | "owner"
  | "manager"
  | "receptionist"
  | "staff";

export type UserMetadata = {
  role?: UserRole | string;
  tenant_id?: string;
  slug?: string;
};

export function normalizeRole(role: string | undefined): UserRole | undefined {
  if (!role) return undefined;
  const r = role.toLowerCase().trim();
  if (r === "ss_team") return "sunshine_admin";
  if (r === "reception") return "receptionist";
  if (
    r === "sunshine_admin" ||
    r === "owner" ||
    r === "manager" ||
    r === "receptionist" ||
    r === "staff"
  ) {
    return r as UserRole;
  }
  return undefined;
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

export function isSunshineAdmin(role: string | undefined): boolean {
  return normalizeRole(role) === "sunshine_admin";
}

export function isShopRole(role: string | undefined): boolean {
  const normalized = normalizeRole(role);
  return (
    normalized === "owner" ||
    normalized === "manager" ||
    normalized === "receptionist" ||
    normalized === "staff"
  );
}

export function parseShopSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard-([^/]+)/);
  return match?.[1] ?? null;
}

/** Sunshine Team admins may open any shop dashboard; shop users only their slug. */
export function canAccessShopDashboard(
  role: string | undefined,
  userSlug: string | undefined,
  shopSlug: string,
): boolean {
  if (isSunshineAdmin(role)) return true;
  return Boolean(userSlug && userSlug === shopSlug);
}
