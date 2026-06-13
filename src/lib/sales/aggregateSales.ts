import type {
  SalesAggregate,
  SalesBookingRow,
  SalesPeriod,
  SalesStaffPayoutRow,
  SalesTimeSeries,
} from "./types";

const SVC_COLORS = ["#EF9F27", "#BA7517", "#854F0B", "#FAC775", "#412402"];
const ADDON_COLORS = ["#1D9E75", "#0F6E56", "#085041", "#04342C"];

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeekMonday(ref: Date) {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildTimeSeries(
  period: SalesPeriod,
  dateRef: string,
  bookings: SalesBookingRow[],
): SalesTimeSeries {
  const byBucket = new Map<string, { revenue: number; payout: number }>();

  for (const b of bookings) {
    const rev = b.servicePrice + b.addonTotal + b.tip;
    const bucket = bucketKey(period, dateRef, b.date);
    const row = byBucket.get(bucket) || { revenue: 0, payout: 0 };
    row.revenue += rev;
    row.payout += b.payout;
    byBucket.set(bucket, row);
  }

  const labels = bucketLabels(period, dateRef);
  const revenue = labels.map((label) => Math.round(byBucket.get(label)?.revenue || 0));
  const payout = labels.map((label) => Math.round(byBucket.get(label)?.payout || 0));
  const profit = revenue.map((rev, i) => Math.round(rev - payout[i]));

  return { labels: displayLabels(period, labels), revenue, payout, profit };
}

function bucketKey(period: SalesPeriod, dateRef: string, bookingDate: string): string {
  const ref = new Date(`${dateRef}T12:00:00`);
  const d = new Date(`${bookingDate}T12:00:00`);

  if (period === "daily") return bookingDate;

  if (period === "weekly") {
    const mon = startOfWeekMonday(ref);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const idx = Math.min(6, Math.max(0, Math.round((d.getTime() - mon.getTime()) / 86_400_000)));
    return days[idx] || isoDate(d);
  }

  if (period === "monthly") {
    const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
    return `Wk${week + 1}`;
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[d.getMonth()] || isoDate(d);
}

function bucketLabels(period: SalesPeriod, dateRef: string): string[] {
  if (period === "daily") return [dateRef];
  if (period === "weekly") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (period === "monthly") return ["Wk1", "Wk2", "Wk3", "Wk4"];
  return [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
}

function displayLabels(period: SalesPeriod, labels: string[]): string[] {
  if (period !== "daily") return labels;
  const d = new Date(`${labels[0]}T12:00:00`);
  return [
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  ];
}

export function aggregateSales(
  bookings: SalesBookingRow[],
  payroll: SalesStaffPayoutRow[],
  period: SalesPeriod,
  dateRef: string,
): SalesAggregate {
  let svcRev = 0;
  let addonRev = 0;
  let tipRev = 0;

  const svcMap: Record<string, { name: string; sessions: number; revenue: number; color: string }> =
    {};
  const addonMap: Record<string, { name: string; sessions: number; revenue: number }> = {};
  let ci = 0;

  for (const b of bookings) {
    svcRev += b.servicePrice;
    tipRev += b.tip;

    if (!svcMap[b.serviceName]) {
      svcMap[b.serviceName] = {
        name: b.serviceName,
        sessions: 0,
        revenue: 0,
        color: SVC_COLORS[ci++ % SVC_COLORS.length],
      };
    }
    svcMap[b.serviceName].sessions += 1;
    svcMap[b.serviceName].revenue += b.servicePrice;

    for (const addon of b.addons) {
      if (!addonMap[addon.name]) {
        addonMap[addon.name] = { name: addon.name, sessions: 0, revenue: 0 };
      }
      addonMap[addon.name].sessions += 1;
      addonMap[addon.name].revenue += addon.price;
      addonRev += addon.price;
    }
  }

  const staffPayout = payroll.map((p) => ({
    ...p,
    base: Math.round(p.base),
    comm: Math.round(p.comm),
    addonComm: Math.round(p.addonComm),
    tip: Math.round(p.tip),
    total: Math.round(p.total),
  }));

  const totalBase = staffPayout.reduce((s, p) => s + p.base, 0);
  const totalComm = staffPayout.reduce((s, p) => s + p.comm, 0);
  const totalAddonC = staffPayout.reduce((s, p) => s + p.addonComm, 0);
  const totalTipC = staffPayout.reduce((s, p) => s + p.tip, 0);
  const totalPayout = staffPayout.reduce((s, p) => s + p.total, 0);
  const totalRev = svcRev + addonRev + tipRev;
  const netProfit = totalRev - totalPayout;

  return {
    svcRev: Math.round(svcRev),
    addonRev: Math.round(addonRev),
    tipRev: Math.round(tipRev),
    totalRev: Math.round(totalRev),
    totalPayout: Math.round(totalPayout),
    netProfit: Math.round(netProfit),
    margin: pct(netProfit, totalRev),
    services: Object.values(svcMap).sort((a, b) => b.revenue - a.revenue),
    addons: Object.values(addonMap)
      .sort((a, b) => b.revenue - a.revenue)
      .map((a, i) => ({ ...a, color: ADDON_COLORS[i % ADDON_COLORS.length] })),
    staffPayout,
    totalBase: Math.round(totalBase),
    totalComm: Math.round(totalComm),
    totalAddonC: Math.round(totalAddonC),
    totalTipC: Math.round(totalTipC),
    timeSeries: buildTimeSeries(period, dateRef, bookings),
  };
}

export { pct };
