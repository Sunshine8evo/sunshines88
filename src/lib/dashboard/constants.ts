import { isSSSystem, normalizeRole } from "@/lib/auth/roles";

export const DEFAULT_DASHBOARD_SLUG = "sunshinetest";

export type LegacyEmbedKind =
  | "calendar"
  | "queue"
  | "clients"
  | "employee-profile"
  | "employee-payroll"
  | "payrollsummary"
  | "salesummary"
  | "setting"
  | "clientsbusiness";

type EmbedConfig = {
  hash: string;
  aliases: readonly string[];
  iframeSrc: string | null;
  title: string;
  iframeTitle: string;
  loadingLabel: string;
  subtitle: (shopName: string) => string;
  ssOnly?: boolean;
};

export const LEGACY_EMBED: Record<LegacyEmbedKind, EmbedConfig> = {
  calendar: {
    hash: "#calendar",
    aliases: ["#calendar", "#calender"],
    iframeSrc: "/index.html?embed=1&view=calendar#booking",
    title: "Calendar",
    iframeTitle: "Booking calendar",
    loadingLabel: "Loading calendar…",
    subtitle: (shop) => `Booking calendar for ${shop}`,
  },
  queue: {
    hash: "#queue",
    aliases: ["#queue", "#queue_screen", "#display"],
    iframeSrc: "/index.html?embed=1&view=queue#display",
    title: "Queue Display",
    iframeTitle: "Queue display",
    loadingLabel: "Loading queue display…",
    subtitle: (shop) => `Live queue board for ${shop}`,
  },
  clients: {
    hash: "#clients",
    aliases: ["#clients", "#cleints"],
    iframeSrc: "/index.html?embed=1&view=clients#clients",
    title: "Clients",
    iframeTitle: "Client list",
    loadingLabel: "Loading clients…",
    subtitle: (shop) => `Client list for ${shop}`,
  },
  "employee-profile": {
    hash: "#employee-profile",
    aliases: ["#employee-profile", "#employee", "#staff"],
    iframeSrc: "/employee.html?embed=1&view=employee-profile",
    title: "Employee Profile",
    iframeTitle: "Employee management",
    loadingLabel: "Loading employees…",
    subtitle: (shop) => `Staff profiles and roles for ${shop}`,
  },
  "employee-payroll": {
    hash: "#employee-payroll",
    aliases: ["#employee-payroll"],
    iframeSrc: "/index.html?embed=1&view=employee-payroll#employee-payroll",
    title: "Employee Payroll",
    iframeTitle: "Employee payroll display",
    loadingLabel: "Loading employee payroll…",
    subtitle: (shop) => `Payroll display settings for ${shop}`,
  },
  payrollsummary: {
    hash: "#payrollsummary",
    aliases: ["#payrollsummary", "#payroll"],
    iframeSrc: "/index.html?embed=1&view=payrollsummary#payrollsummary",
    title: "Payroll Summary",
    iframeTitle: "Payroll summary",
    loadingLabel: "Loading payroll summary…",
    subtitle: (shop) => `Payroll totals and stats for ${shop}`,
  },
  salesummary: {
    hash: "#salesummary",
    aliases: ["#salesummary", "#sales"],
    iframeSrc: "/index.html?embed=1&view=salesummary#salesummary",
    title: "Sale Summary",
    iframeTitle: "Sale summary",
    loadingLabel: "Loading sale summary…",
    subtitle: (shop) => `Sales totals for ${shop}`,
  },
  setting: {
    hash: "#setting",
    aliases: ["#setting", "#settings"],
    iframeSrc: "/index.html?embed=1&view=setting#setting",
    title: "Settings",
    iframeTitle: "Shop settings",
    loadingLabel: "Loading settings…",
    subtitle: (shop) => `Services, add-ons, commission, rooms & intake for ${shop}`,
  },
  clientsbusiness: {
    hash: "#clientsbusiness",
    aliases: ["#clientsbusiness"],
    iframeSrc: null,
    title: "Clients Business",
    iframeTitle: "Tenant directory",
    loadingLabel: "Loading shops…",
    subtitle: () => "Shops in the system — quick access to each dashboard",
    ssOnly: true,
  },
};

const HASH_TO_KIND = new Map<string, LegacyEmbedKind>();
for (const [kind, config] of Object.entries(LEGACY_EMBED) as [LegacyEmbedKind, EmbedConfig][]) {
  for (const alias of config.aliases) {
    HASH_TO_KIND.set(alias.toLowerCase(), kind);
  }
}

/** @deprecated use LEGACY_EMBED.calendar.hash */
export const SS_SYSTEM_CALENDAR_HASH = LEGACY_EMBED.calendar.hash;
export const SS_SYSTEM_CALENDAR_HREF = `/dashboard${LEGACY_EMBED.calendar.hash}`;
export const LEGACY_CALENDAR_EMBED_SRC = LEGACY_EMBED.calendar.iframeSrc;
export const SS_SYSTEM_QUEUE_HREF = `/dashboard${LEGACY_EMBED.queue.hash}`;
export const LEGACY_QUEUE_EMBED_SRC = LEGACY_EMBED.queue.iframeSrc;

export function resolveDashboardBase(pathname: string, slug: string): string {
  if (pathname === "/dashboard") return "/dashboard";
  return `/dashboard-${slug}`;
}

export function dashboardHashHref(base: string, kind: LegacyEmbedKind): string {
  return `${base}${LEGACY_EMBED[kind].hash}`;
}

export function normalizeHash(hash: string): string {
  const raw = (hash || "").trim().toLowerCase();
  return raw.startsWith("#") ? raw : raw ? `#${raw}` : "";
}

export function resolveLegacyEmbedKind(hash: string): LegacyEmbedKind | null {
  const normalized = normalizeHash(hash);
  if (!normalized) return null;
  return HASH_TO_KIND.get(normalized) ?? null;
}

export function isLegacyEmbedHash(hash: string): boolean {
  return resolveLegacyEmbedKind(hash) !== null;
}

/** @deprecated use resolveLegacyEmbedKind */
export function isCalendarHash(hash: string): boolean {
  return resolveLegacyEmbedKind(hash) === "calendar";
}

/** @deprecated use resolveLegacyEmbedKind */
export function isQueueHash(hash: string): boolean {
  return resolveLegacyEmbedKind(hash) === "queue";
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
