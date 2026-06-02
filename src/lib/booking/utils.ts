import {
  CLOSE_HOUR,
  OPEN_HOUR,
  SLOT_INTERVAL_MINS,
} from "./constants";
import type { BookingSlot, ExistingBooking, Staff } from "./types";

export function calcWeekDay(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function bookingStartMins(b: BookingSlot): number {
  return b.h * 60 + b.m;
}

export function bookingEndMins(b: BookingSlot): number {
  return bookingStartMins(b) + b.dur;
}

export function bookingsOverlap(a: BookingSlot, b: BookingSlot): boolean {
  if (a.bookingDate !== b.bookingDate) return false;
  if (a.col !== b.col) return false;
  return (
    bookingStartMins(a) < bookingEndMins(b) &&
    bookingStartMins(b) < bookingEndMins(a)
  );
}

export function hasBookingConflict(
  candidate: BookingSlot,
  existing: ExistingBooking[],
): boolean {
  return existing.some((b) => bookingsOverlap(candidate, b));
}

export function buildTimeSlots(duration: number): string[] {
  const slots: string[] = [];
  const latestStart = CLOSE_HOUR * 60 - duration;

  for (let mins = OPEN_HOUR * 60; mins <= latestStart; mins += SLOT_INTERVAL_MINS) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  return slots;
}

export function findAvailableColumn(
  bookingDate: string,
  time: string,
  duration: number,
  staffList: Staff[],
  existing: ExistingBooking[],
  preferredStaff?: string,
): { col: number; staff: string } | null {
  const [h, m] = time.split(":").map(Number);
  const activeStaff = staffList.filter((s) => s.status === "on");

  const tryStaff = preferredStaff
    ? activeStaff.filter((s) => s.name === preferredStaff)
    : activeStaff;

  for (const staffMember of tryStaff) {
    const col = staffList.findIndex((s) => s.name === staffMember.name) + 1;
    if (col < 1) continue;

    const candidate: BookingSlot = { bookingDate, h, m, dur: duration, col };
    if (!hasBookingConflict(candidate, existing)) {
      return { col, staff: staffMember.name };
    }
  }

  return null;
}

export function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map(Number);
  return { h, m };
}
