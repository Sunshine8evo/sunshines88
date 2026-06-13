import type { SupabaseClient } from "@supabase/supabase-js";

import {
  FALLBACK_ADDONS,
  FALLBACK_SERVICES,
} from "@/lib/booking/constants";
import {
  type CommissionConfig,
  fetchActiveCommission,
} from "@/lib/dashboard/queries";
import type { PriceCatalog } from "@/lib/dashboard/types";
import {
  getDateRange,
  isCompletedStatus,
  parseAddonTokens,
} from "@/lib/dashboard/utils";

import type { SalesFetchResult, SalesPeriod, SalesStaffPayoutRow } from "./types";

type LegacyBooking = {
  id: string;
  booking_date: string;
  svc?: string;
  addon?: string;
  staff?: string;
  status?: string;
  tip?: number | string;
  discount?: number | string;
};

type StaffRow = {
  id: string;
  name: string;
  auth_role?: string;
  role?: string;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function loadPriceCatalog(supabase: SupabaseClient): Promise<PriceCatalog> {
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
    if (row.name) services.set(row.name.toLowerCase(), num(row.price));
  });
  addonRows.forEach((row) => {
    if (row.name) addons.set(row.name.toLowerCase(), num(row.price));
  });

  if (services.size === 0) {
    FALLBACK_SERVICES.forEach((s) => services.set(s.name.toLowerCase(), s.price));
  }
  if (addons.size === 0) {
    FALLBACK_ADDONS.forEach((a) => addons.set(a.name.toLowerCase(), a.price));
  }

  return { services, addons };
}

function lookupServicePrice(catalog: PriceCatalog, svcName: string): number {
  const key = svcName.trim().toLowerCase();
  if (catalog.services.has(key)) return catalog.services.get(key)!;
  for (const [name, price] of catalog.services) {
    if (key.includes(name) || name.includes(key)) return price;
  }
  return 0;
}

function lookupAddonPrice(catalog: PriceCatalog, token: string): number {
  const key = token.trim().toLowerCase();
  if (catalog.addons.has(key)) return catalog.addons.get(key) || 0;
  for (const [name, price] of catalog.addons) {
    if (key.includes(name) || name.includes(key)) return price;
  }
  return 0;
}

function lookupAddonItems(catalog: PriceCatalog, addonRaw: string) {
  return parseAddonTokens(addonRaw).map((name) => ({
    name,
    price: lookupAddonPrice(catalog, name),
  }));
}

function serviceCommission(
  config: CommissionConfig | null,
  svcPrice: number,
): number {
  if (!config) return 0;
  if (config.method === "flat") return config.price;
  return svcPrice * (config.rate / 100);
}

async function fetchBookingsInRange(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<LegacyBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id,booking_date,svc,addon,staff,status,tip,discount")
    .gte("booking_date", startDate)
    .lte("booking_date", endDate)
    .order("booking_date", { ascending: true });

  if (error) throw error;
  return (data || []) as LegacyBooking[];
}

async function loadStaffRoster(supabase: SupabaseClient): Promise<StaffRow[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id,name,auth_role,role")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data || []) as StaffRow[];
}

export async function fetchSalesData(
  supabase: SupabaseClient,
  period: SalesPeriod,
  dateRef: string,
): Promise<SalesFetchResult> {
  const ref = new Date(`${dateRef}T12:00:00`);
  const { startDate, endDate } = getDateRange(period, ref);
  const [catalog, bookingsRaw, roster] = await Promise.all([
    loadPriceCatalog(supabase),
    fetchBookingsInRange(supabase, startDate, endDate),
    loadStaffRoster(supabase),
  ]);

  const bookings = bookingsRaw.filter((b) => isCompletedStatus(b.status || ""));
  const rosterByName = new Map(roster.map((s) => [s.name.toLowerCase(), s]));
  const commissionCache = new Map<string, CommissionConfig | null>();

  async function commissionForRole(role: string) {
    const key = role.toLowerCase();
    if (!commissionCache.has(key)) {
      commissionCache.set(key, await fetchActiveCommission(supabase, key));
    }
    return commissionCache.get(key)!;
  }

  type StaffAcc = SalesStaffPayoutRow & { staffKey: string };
  const staffMap = new Map<string, StaffAcc>();

  const bookingRows: SalesFetchResult["bookings"] = [];

  for (const b of bookings) {
    const serviceName = (b.svc || "").trim() || "Unknown";
    const servicePrice = Math.max(
      0,
      lookupServicePrice(catalog, serviceName) - num(b.discount),
    );
    const addonItems = lookupAddonItems(catalog, b.addon || "");
    const addonTotal = addonItems.reduce((sum, item) => sum + item.price, 0);
    const tip = num(b.tip);
    const staffName = (b.staff || "").trim() || "Unassigned";

    const rosterRow = rosterByName.get(staffName.toLowerCase());
    const role = rosterRow?.role || rosterRow?.auth_role || "staff";
    const commCfg = await commissionForRole(role);
    const comm = serviceCommission(commCfg, servicePrice);
    const payout = comm + addonTotal + tip;

    bookingRows.push({
      id: String(b.id),
      date: b.booking_date,
      serviceName,
      servicePrice,
      addons: addonItems,
      addonTotal,
      tip,
      staff: staffName,
      payout,
    });

    const staffKey = staffName.toLowerCase();
    if (!staffMap.has(staffKey)) {
      staffMap.set(staffKey, {
        id: rosterRow?.id || staffKey,
        name: staffName,
        role,
        base: 0,
        comm: 0,
        addonComm: 0,
        tip: 0,
        total: 0,
        staffKey,
      });
    }

    const acc = staffMap.get(staffKey)!;
    acc.comm += comm;
    acc.addonComm += addonTotal;
    acc.tip += tip;
    acc.total += payout;
  }

  const payroll = [...staffMap.values()]
    .map(({ staffKey: _sk, ...row }) => ({
      ...row,
      base: Math.round(row.base),
      comm: Math.round(row.comm),
      addonComm: Math.round(row.addonComm),
      tip: Math.round(row.tip),
      total: Math.round(row.total),
    }))
    .sort((a, b) => b.total - a.total);

  return { bookings: bookingRows, payroll };
}
