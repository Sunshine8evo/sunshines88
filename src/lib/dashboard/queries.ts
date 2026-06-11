import type { SupabaseClient } from "@supabase/supabase-js";

import {
  FALLBACK_ADDONS,
  FALLBACK_SERVICES,
} from "@/lib/booking/constants";

import type {
  PayrollPeriod,
  PriceCatalog,
  QueueItem,
  SalePeriod,
  SaleSummaryData,
  StaffPayroll,
  TodayTurn,
} from "./types";
import {
  QUEUE_STATUSES,
  clientDisplayName,
  formatTimeFromParts,
  getDateRange,
  isCompletedStatus,
  mapQueueStatus,
  parseAddonTokens,
} from "./utils";

type LegacyBooking = {
  id: string;
  booking_date: string;
  h: number;
  m: number;
  dur: number;
  fname?: string;
  lname?: string;
  name?: string;
  svc?: string;
  addon?: string;
  addon_detail?: unknown;
  staff?: string;
  status?: string;
  req?: boolean;
  tip?: number | string;
  payment_method?: string;
  discount?: number | string;
};

type StaffRow = {
  id: string;
  name: string;
  full_name?: string;
  auth_role?: string;
  role?: string;
};

async function loadPriceCatalogUncached(supabase: SupabaseClient): Promise<PriceCatalog> {
  const services = new Map<string, number>();
  const addons = new Map<string, number>();

  type PriceRow = { name: string; price: number | string };

  const [svcRows, addonRows] = await Promise.all([
    supabase
      .from("services")
      .select("name,price")
      .then(({ data, error }) => (error ? [] : ((data || []) as PriceRow[]))),
    supabase
      .from("addons")
      .select("name,price")
      .then(({ data, error }) => (error ? [] : ((data || []) as PriceRow[]))),
  ]);

  svcRows.forEach((row) => {
    if (row.name) services.set(row.name.toLowerCase(), Number(row.price) || 0);
  });
  addonRows.forEach((row) => {
    if (row.name) addons.set(row.name.toLowerCase(), Number(row.price) || 0);
  });

  if (services.size === 0) {
    FALLBACK_SERVICES.forEach((s) => services.set(s.name.toLowerCase(), s.price));
  }
  if (addons.size === 0) {
    FALLBACK_ADDONS.forEach((a) => addons.set(a.name.toLowerCase(), a.price));
  }

  return { services, addons };
}

// Prices rarely change; cache briefly so payroll + sales don't re-fetch the same catalog.
const CATALOG_TTL_MS = 5 * 60_000;
let catalogCache: { at: number; promise: Promise<PriceCatalog> } | null = null;

function loadPriceCatalog(supabase: SupabaseClient): Promise<PriceCatalog> {
  const now = Date.now();
  if (catalogCache && now - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache.promise;
  }
  const promise = loadPriceCatalogUncached(supabase).catch((err) => {
    catalogCache = null;
    throw err;
  });
  catalogCache = { at: now, promise };
  return promise;
}

function lookupServicePrice(catalog: PriceCatalog, svcName: string): number {
  const key = svcName.trim().toLowerCase();
  if (catalog.services.has(key)) return catalog.services.get(key)!;
  for (const [name, price] of catalog.services) {
    if (key.includes(name) || name.includes(key)) return price;
  }
  return 0;
}

function lookupAddonPrices(catalog: PriceCatalog, addonRaw: string): number {
  const tokens = parseAddonTokens(addonRaw);
  return tokens.reduce((sum, token) => {
    const key = token.toLowerCase();
    if (catalog.addons.has(key)) return sum + (catalog.addons.get(key) || 0);
    for (const [name, price] of catalog.addons) {
      if (key.includes(name) || name.includes(key)) return sum + price;
    }
    return sum;
  }, 0);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Dedupe concurrent identical range fetches (e.g. payroll "daily" + sales "today"
// both request today's bookings during the same dashboard load).
const bookingsInflight = new Map<string, Promise<LegacyBooking[]>>();

function fetchBookingsInRange(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<LegacyBooking[]> {
  const key = `${startDate}|${endDate}`;
  const existing = bookingsInflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id,booking_date,h,m,dur,fname,lname,name,svc,addon,addon_detail,staff,status,req,tip,payment_method,discount",
      )
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .order("booking_date", { ascending: true })
      .order("h", { ascending: true })
      .order("m", { ascending: true });

    if (error) throw error;
    return (data || []) as LegacyBooking[];
  })().finally(() => {
    bookingsInflight.delete(key);
  });

  bookingsInflight.set(key, promise);
  return promise;
}

let queueHasRoomColumn = true;

export async function fetchQueue(
  supabase: SupabaseClient,
  today: string,
): Promise<QueueItem[]> {
  const queueQuery = (columns: string) =>
    supabase
      .from("bookings")
      .select(columns)
      .eq("booking_date", today)
      .in("status", QUEUE_STATUSES)
      .order("h", { ascending: true })
      .order("m", { ascending: true });

  const baseColumns = "id,booking_date,h,m,dur,fname,lname,name,svc,addon,staff,status,req";

  let { data, error } = await queueQuery(
    queueHasRoomColumn ? `${baseColumns},room` : baseColumns,
  );

  if (error && queueHasRoomColumn) {
    // Older databases may not have the room column yet; remember so we
    // don't pay for a failed request on every refresh.
    queueHasRoomColumn = false;
    ({ data, error } = await queueQuery(baseColumns));
  }

  if (error) throw error;

  return ((data || []) as unknown as (LegacyBooking & { room?: string })[]).map((b) => ({
    id: b.id,
    time: formatTimeFromParts(b.h, b.m),
    durationMinutes: b.dur || 60,
    startMinutes: (b.h || 0) * 60 + (b.m || 0),
    clientName: clientDisplayName(b.fname, b.lname, b.name),
    service: (b.svc || "").trim(),
    addons: parseAddonTokens(b.addon || ""),
    staffName: (b.staff || "").trim(),
    requested: Boolean(b.req),
    room: (b.room || "").trim(),
    status: mapQueueStatus(b.status || "pending"),
    rawStatus: (b.status || "pending").toLowerCase(),
  }));
}

export async function fetchTodaySummary(
  supabase: SupabaseClient,
  today: string,
  staffName: string,
): Promise<TodayTurn[]> {
  const catalog = await loadPriceCatalog(supabase);
  const { data, error } = await supabase
    .from("bookings")
    .select("id,h,m,dur,fname,lname,name,svc,addon,staff,status,tip")
    .eq("booking_date", today)
    .eq("status", "done")
    .eq("staff", staffName)
    .order("h", { ascending: true })
    .order("m", { ascending: true });

  if (error) throw error;

  return ((data || []) as LegacyBooking[]).map((b, i) => {
    const commission = lookupAddonPrices(catalog, b.addon || "");
    const tips = num(b.tip);
    const servicePrice = lookupServicePrice(catalog, b.svc || "");
    return {
      turn: i + 1,
      time: formatTimeFromParts(b.h, b.m),
      hours: (b.dur || 60) / 60,
      clientName: clientDisplayName(b.fname, b.lname, b.name),
      tips,
      commission,
      total: servicePrice + commission + tips,
    };
  });
}

// Roster changes rarely; cache briefly so resolveEmployeeName + payroll
// don't re-fetch it during the same dashboard load.
const ROSTER_TTL_MS = 60_000;
let rosterCache: { at: number; promise: Promise<StaffRow[]> } | null = null;

function loadStaffRoster(supabase: SupabaseClient): Promise<StaffRow[]> {
  const now = Date.now();
  if (rosterCache && now - rosterCache.at < ROSTER_TTL_MS) {
    return rosterCache.promise;
  }
  const promise = (async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("id,name,full_name,auth_role,role")
      .order("sort_order", { ascending: true });

    if (error) return [];
    return (data || []) as StaffRow[];
  })().catch(() => {
    rosterCache = null;
    return [] as StaffRow[];
  });
  rosterCache = { at: now, promise };
  return promise;
}

export async function fetchPayrollSummary(
  supabase: SupabaseClient,
  period: PayrollPeriod,
  options: { staffName?: string; ownerView: boolean },
): Promise<{ staff: StaffPayroll[]; grand: StaffPayroll | null; label: string }> {
  const { startDate, endDate, label } = getDateRange(period);
  const catalog = await loadPriceCatalog(supabase);
  const bookings = (await fetchBookingsInRange(supabase, startDate, endDate)).filter((b) =>
    isCompletedStatus(b.status || ""),
  );

  const roster = await loadStaffRoster(supabase);
  const rosterByName = new Map(roster.map((s) => [s.name.toLowerCase(), s]));

  type Acc = {
    name: string;
    role: string;
    byDay: Map<string, { hours: number; commission: number; tip: number }>;
  };

  const byStaff = new Map<string, Acc>();

  for (const b of bookings) {
    const staffKey = (b.staff || "").trim();
    if (!staffKey) continue;
    if (!options.ownerView && staffKey.toLowerCase() !== (options.staffName || "").toLowerCase()) {
      continue;
    }

    const day = b.booking_date;
    const hours = (b.dur || 60) / 60;
    const commission = lookupAddonPrices(catalog, b.addon || "");
    const tip = num(b.tip);

    if (!byStaff.has(staffKey)) {
      const row = rosterByName.get(staffKey.toLowerCase());
      byStaff.set(staffKey, {
        name: staffKey,
        role: row?.role || row?.auth_role || "Therapist",
        byDay: new Map(),
      });
    }

    const acc = byStaff.get(staffKey)!;
    const dayAcc = acc.byDay.get(day) || { hours: 0, commission: 0, tip: 0 };
    dayAcc.hours += hours;
    dayAcc.commission += commission;
    dayAcc.tip += tip;
    acc.byDay.set(day, dayAcc);
  }

  const staffList: StaffPayroll[] = [...byStaff.entries()].map(([key, acc]) => {
    const rows = [...acc.byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        day: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
        hours: Math.round(d.hours * 10) / 10,
        commission: Math.round(d.commission),
        tip: Math.round(d.tip),
        total: Math.round(d.commission + d.tip),
      }));

    const totalHours = rows.reduce((s, r) => s + r.hours, 0);
    const totalCommission = rows.reduce((s, r) => s + r.commission, 0);
    const totalTip = rows.reduce((s, r) => s + r.tip, 0);

    return {
      id: key,
      name: acc.name,
      role: acc.role,
      rows,
      totalHours: Math.round(totalHours * 10) / 10,
      totalCommission,
      totalTip,
      total: totalCommission + totalTip,
    };
  });

  const grand: StaffPayroll = {
    id: "grand",
    name: "Grand Total",
    role: "",
    rows: [],
    totalHours: staffList.reduce((s, x) => s + x.totalHours, 0),
    totalCommission: staffList.reduce((s, x) => s + x.totalCommission, 0),
    totalTip: staffList.reduce((s, x) => s + x.totalTip, 0),
    total: staffList.reduce((s, x) => s + x.total, 0),
  };

  return { staff: staffList, grand: options.ownerView ? grand : null, label };
}

function paymentBucket(method: string): "cash" | "card" {
  const m = method.toLowerCase();
  if (m.includes("cash")) return "cash";
  return "card";
}

export async function fetchSaleSummary(
  supabase: SupabaseClient,
  period: SalePeriod,
): Promise<SaleSummaryData> {
  const { startDate, endDate } = getDateRange(period);
  const catalog = await loadPriceCatalog(supabase);
  const bookings = (await fetchBookingsInRange(supabase, startDate, endDate)).filter((b) =>
    isCompletedStatus(b.status || ""),
  );

  const empty = (): { services: number; addons: number; tips: number; total: number } => ({
    services: 0,
    addons: 0,
    tips: 0,
    total: 0,
  });

  const cash = empty();
  const card = empty();
  const clients = new Set<string>();

  for (const b of bookings) {
    const bucket = paymentBucket(b.payment_method || "");
    const target = bucket === "cash" ? cash : card;
    const svc = lookupServicePrice(catalog, b.svc || "");
    const addons = lookupAddonPrices(catalog, b.addon || "");
    const tips = num(b.tip);
    const discount = num(b.discount);

    target.services += Math.max(0, svc - discount);
    target.addons += addons;
    target.tips += tips;
    target.total += Math.max(0, svc - discount) + addons + tips;

    const clientKey = `${b.fname}|${b.lname}|${b.name}|${b.booking_date}`;
    clients.add(clientKey);
  }

  const grand = {
    services: cash.services + card.services,
    addons: cash.addons + card.addons,
    tips: cash.tips + card.tips,
    total: cash.total + card.total,
  };

  return {
    clientCount: clients.size,
    revenue: grand.total,
    cash,
    card,
    grand,
  };
}

export async function resolveEmployeeName(
  supabase: SupabaseClient,
  userName: string,
  userEmail?: string,
): Promise<string> {
  const roster = await loadStaffRoster(supabase);
  const byName = roster.find(
    (s) =>
      s.name.toLowerCase() === userName.toLowerCase() ||
      (s.full_name || "").toLowerCase() === userName.toLowerCase(),
  );
  if (byName) return byName.name;

  if (userEmail) {
    try {
      const { data } = await supabase
        .from("staff_auth")
        .select("name,display_name")
        .eq("email", userEmail)
        .maybeSingle();
      if (data?.name) {
        const match = roster.find((s) => s.name.toLowerCase() === String(data.name).toLowerCase());
        return match?.name || String(data.display_name || data.name);
      }
    } catch {
      /* optional */
    }
  }

  return userName;
}
