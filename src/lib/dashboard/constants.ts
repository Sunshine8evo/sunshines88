import { isSSSystem, normalizeRole } from "@/lib/auth/roles";

export const DEFAULT_DASHBOARD_SLUG = "sunshinetest";

export type LegacyEmbedKind = "calendar" | "queue";

export const LEGACY_EMBED = {
  calendar: {
    hash: "#calender",
    href: "/dashboard#calender",
    iframeSrc: "/index.html?embed=1#booking",
    title: "Calendar",
    iframeTitle: "Booking calendar",
    loadingLabel: "Loading calendar…",
  },
  queue: {
    hash: "#queue_screen",
    href: "/dashboard#queue_screen",
    iframeSrc: "/index.html?embed=1#display",
    title: "Queue Display",
    iframeTitle: "Queue display",
    loadingLabel: "Loading queue display…",
  },
} as const;

/** @deprecated use LEGACY_EMBED.calendar.href */
export const SS_SYSTEM_CALENDAR_HASH = LEGACY_EMBED.calendar.hash;
export const SS_SYSTEM_CALENDAR_HREF = LEGACY_EMBED.calendar.href;
export const LEGACY_CALENDAR_EMBED_SRC = LEGACY_EMBED.calendar.iframeSrc;

export const SS_SYSTEM_QUEUE_HREF = LEGACY_EMBED.queue.href;
export const LEGACY_QUEUE_EMBED_SRC = LEGACY_EMBED.queue.iframeSrc;

const CALENDAR_HASHES = new Set(["#calender", "#calendar"]);
const QUEUE_HASHES = new Set(["#queue_screen", "#queue", "#display"]);

export function isCalendarHash(hash: string): boolean {
  return CALENDAR_HASHES.has(hash.toLowerCase());
}

export function isQueueHash(hash: string): boolean {
  return QUEUE_HASHES.has(hash.toLowerCase());
}

export function isLegacyEmbedHash(hash: string): boolean {
  return isCalendarHash(hash) || isQueueHash(hash);
}

export function resolveLegacyEmbedKind(hash: string): LegacyEmbedKind | null {
  if (isCalendarHash(hash)) return "calendar";
  if (isQueueHash(hash)) return "queue";
  return null;
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
