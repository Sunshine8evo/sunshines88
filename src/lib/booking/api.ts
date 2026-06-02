import type { SupabaseClient } from "@supabase/supabase-js";

import {
  FALLBACK_ADDONS,
  FALLBACK_SERVICES,
  FALLBACK_STAFF,
} from "./constants";
import {
  calcWeekDay,
  parseTime,
} from "./utils";
import { insertBookingRow } from "./db";
import type {
  Addon,
  CustomerBookingInput,
  ExistingBooking,
  Service,
  Staff,
} from "./types";

type DbService = {
  id: string;
  name: string;
  price: number | string;
  duration: number;
  type: string | null;
};

type DbStaff = {
  id: string;
  name: string;
  full_name: string;
  status: string | null;
  show_in_booking: boolean | null;
};

type DbAddon = {
  id: string;
  name: string;
  price: number | string;
};

type DbBooking = {
  id: string;
  booking_date: string;
  h: number;
  m: number;
  dur: number;
  staff_col: number | null;
};

export async function loadServices(supabase: SupabaseClient): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id,name,price,duration,type")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return FALLBACK_SERVICES;

  return (data as DbService[]).map((row) => ({
    id: row.id,
    name: row.name,
    price: Number(row.price),
    duration: Number(row.duration),
    type: row.type || "single",
  }));
}

export async function loadStaff(supabase: SupabaseClient): Promise<Staff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id,name,full_name,status,show_in_booking")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return FALLBACK_STAFF;

  return (data as DbStaff[])
    .filter(
      (row) =>
        row.show_in_booking !== false && (row.status || "on").toLowerCase() === "on",
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      full_name: row.full_name,
      status: row.status || "on",
    }));
}

export async function loadAddons(supabase: SupabaseClient): Promise<Addon[]> {
  const { data, error } = await supabase
    .from("addons")
    .select("id,name,price")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return FALLBACK_ADDONS;

  return (data as DbAddon[]).map((row) => ({
    id: row.id,
    name: row.name,
    price: Number(row.price),
  }));
}

export async function loadBookingsForDate(
  supabase: SupabaseClient,
  bookingDate: string,
): Promise<ExistingBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id,booking_date,h,m,dur,staff_col")
    .eq("booking_date", bookingDate);

  if (error || !data) return [];

  return (data as DbBooking[]).map((row) => ({
    id: row.id,
    bookingDate: row.booking_date,
    h: Number(row.h),
    m: Number(row.m),
    dur: Number(row.dur),
    col: Number(row.staff_col) || 1,
  }));
}

export async function createCustomerBooking(
  supabase: SupabaseClient,
  input: CustomerBookingInput,
  assignment: { col: number; staff: string },
): Promise<void> {
  const { h, m } = parseTime(input.time);
  const addonNames = input.addons.map((a) => a.name).join(", ");

  const row = {
    booking_date: input.bookingDate,
    h,
    m,
    dur: input.service.duration,
    fname: input.fname,
    lname: input.lname,
    phone: input.phone,
    name: `${input.fname}${input.lname ? ` ${input.lname}` : ""}`.trim(),
    svc: input.service.name,
    staff_col: assignment.col,
    status: "pending",
    req: input.requestStaff && !!input.staffName,
    addon: addonNames,
    staff: assignment.staff,
    room: "",
    intime: "",
    outtime: "",
    week_day: calcWeekDay(input.bookingDate),
    notes: input.notes,
    client_id: 0,
    discount: 0,
    tip: 0,
    payment_method: "",
  };

  await insertBookingRow(supabase, row);
}
