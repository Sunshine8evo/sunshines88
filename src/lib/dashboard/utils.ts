import { isSunshineAdmin, normalizeRole } from "@/lib/auth/roles";
import { formatMoney, todayISO } from "@/lib/booking/utils";

import type { PayrollPeriod, SalePeriod } from "./types";

export const EXCLUDED_PAYROLL_ROLES = ["manager", "receptionist", "cleaner", "reception"];

export function showToolsMenu(role: string | undefined): boolean {
  const r = normalizeRole(role);
  return isSunshineAdmin(role) || r === "owner";
}

export function isStaffRole(role: string | undefined): boolean {
  return normalizeRole(role) === "staff";
}

export function roleLabel(role: string | undefined): string {
  const r = normalizeRole(role);
  switch (r) {
    case "sunshine_admin":
      return "SS Team";
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "receptionist":
      return "Receptionist";
    case "staff":
      return "Staff";
    default:
      return role ?? "User";
  }
}

export function formatDurationBadge(minutes: number): string {
  if (minutes >= 90 && minutes % 60 !== 0) return `${minutes / 60}hr`;
  const hrs = minutes / 60;
  return hrs === 1 ? "1hr" : `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)}hr`;
}

export function formatClock(now = new Date()): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = days[now.getDay()];
  const mo = months[now.getMonth()];
  const dt = now.getDate();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${d} ${mo} ${dt}, ${now.getFullYear()} · ${h12}:${m} ${ampm}`;
}

export function formatWelcomeDate(now = new Date()): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

export function formatTimeFromParts(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatShortDay(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

export function mapQueueStatus(status: string): "active" | "cancel" | "noshow" {
  const s = status.toLowerCase();
  if (s === "cancel") return "cancel";
  if (s === "done") return "noshow";
  return "active";
}

export const QUEUE_STATUSES = ["pending", "confirm", "inservice", "delay"];

export function isCompletedStatus(status: string): boolean {
  return status.toLowerCase() === "done";
}

export function getDateRange(
  period: PayrollPeriod | SalePeriod,
  ref = new Date(),
): { startDate: string; endDate: string; label: string } {
  const end = new Date(ref);
  const start = new Date(ref);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (period === "daily" || period === "today") {
    const iso = fmt(end);
    const label = `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    return { startDate: iso, endDate: iso, label };
  }

  if (period === "weekly") {
    const day = end.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    start.setDate(end.getDate() + diffToMon);
    const label = `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
    return { startDate: fmt(start), endDate: fmt(end), label };
  }

  if (period === "monthly") {
    start.setDate(1);
    const label = `${months[end.getMonth()]} ${end.getFullYear()}`;
    return { startDate: fmt(start), endDate: fmt(end), label };
  }

  start.setMonth(0, 1);
  return {
    startDate: fmt(start),
    endDate: fmt(end),
    label: `Year ${end.getFullYear()}`,
  };
}

export function clientDisplayName(fname?: string, lname?: string, name?: string): string {
  const first = (fname || "").trim();
  const last = (lname || "").trim();
  if (first || last) {
    const lastInitial = last ? ` ${last.charAt(0)}.` : "";
    return `${first}${lastInitial}`.trim();
  }
  return (name || "Guest").trim() || "Guest";
}

export function parseAddonTokens(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,+|;]/)
    .map((s) => s.trim().replace(/^\+/, ""))
    .filter(Boolean);
}

export function initials(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export { formatMoney, todayISO };
