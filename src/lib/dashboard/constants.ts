import { isSSSystem, normalizeRole } from "@/lib/auth/roles";

export const DEFAULT_DASHBOARD_SLUG = "sunshinetest";

/** SS System calendar — replaces legacy /index.html#booking */
export const SS_SYSTEM_CALENDAR_HASH = "#calender";
export const SS_SYSTEM_CALENDAR_HREF = `/dashboard${SS_SYSTEM_CALENDAR_HASH}`;

export function isCalendarHash(hash: string): boolean {
  const h = hash.toLowerCase();
  return h === "#calender" || h === "#calendar";
}

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
