import { isSSSystem, normalizeRole } from "@/lib/auth/roles";

export const DEFAULT_DASHBOARD_SLUG = "sunshinetest";

export function resolveDashboardSlug(
  role: string | undefined,
  userSlug: string | undefined,
): string | null {
  if (isSSSystem(role)) {
    return userSlug ?? DEFAULT_DASHBOARD_SLUG;
  }
  const normalized = normalizeRole(role);
  if (normalized === "owner" || normalized === "staff") {
    return userSlug ?? null;
  }
  return null;
}
