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

export function checkStaffBusy(
  staff: Staff,
  bookingDate: string,
  time: string,
  duration: number,
  existing: ExistingBooking[],
  staffList: Staff[],
): boolean {
  const [h, m] = time.split(":").map(Number);
  const col = staffList.findIndex((s) => s.name === staff.name) + 1;
  if (col < 1) return true;

  const candidate: BookingSlot = { bookingDate, h, m, dur: duration, col };
  if (hasBookingConflict(candidate, existing)) return true;

  return existing.some((b) => {
    if (b.bookingDate !== bookingDate || b.staff !== staff.name) return false;
    const other: BookingSlot = {
      bookingDate: b.bookingDate,
      h: b.h,
      m: b.m,
      dur: b.dur,
      col: b.col,
    };
    return bookingsOverlap(candidate, other);
  });
}

export function getNextAvailableStaff(
  bookingDate: string,
  time: string,
  duration: number,
  staffList: Staff[],
  existing: ExistingBooking[],
): Staff | null {
  const workingStaff = [...staffList]
    .filter((s) => s.status === "on")
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  for (const staff of workingStaff) {
    if (!checkStaffBusy(staff, bookingDate, time, duration, existing, staffList)) {
      return staff;
    }
  }
  return null;
}

export function findAvailableColumn(
  bookingDate: string,
  time: string,
  duration: number,
  staffList: Staff[],
  existing: ExistingBooking[],
  preferredStaff?: string,
): { col: number; staff: string } | null {
  if (preferredStaff) {
    const preferred = staffList.find((s) => s.name === preferredStaff && s.status === "on");
    if (
      preferred &&
      !checkStaffBusy(preferred, bookingDate, time, duration, existing, staffList)
    ) {
      const col = staffList.findIndex((s) => s.name === preferred.name) + 1;
      if (col >= 1) return { col, staff: preferred.name };
    }
  }

  const next = getNextAvailableStaff(bookingDate, time, duration, staffList, existing);
  if (!next) return null;

  const col = staffList.findIndex((s) => s.name === next.name) + 1;
  if (col < 1) return null;
  return { col, staff: next.name };
}

export function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map(Number);
  return { h, m };
}
