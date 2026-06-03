import type { SupabaseClient } from "@supabase/supabase-js";

import {
  FALLBACK_ADDONS,
  FALLBACK_SERVICES,
  FALLBACK_STAFF,
} from "./constants";
import {
  calcWeekDay,
  dedupeServices,
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
  active?: boolean | null;
  sort_order?: number | null;
};

type DbStaff = {
  id: string;
  name: string;
  full_name: string;
  status: string | null;
  show_in_booking: boolean | null;
  auth_role: string | null;
  role: string | null;
  sort_order: number | null;
  work_days: number[] | string | null;
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
  staff: string | null;
};

function parseWorkDays(raw: DbStaff["work_days"]): number[] {
  if (raw == null) return [0, 1, 2, 3, 4, 5, 6];
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as number[];
      return Array.isArray(parsed) ? parsed : [0, 1, 2, 3, 4, 5, 6];
    } catch {
      return [0, 1, 2, 3, 4, 5, 6];
    }
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

function resolveStaffAuthRole(row: DbStaff): string {
  const auth = String(row.auth_role || "").toLowerCase().trim();
  if (auth) return auth;
  const role = String(row.role || "").toLowerCase().trim();
  if (["owner", "manager", "reception", "receptionist", "staff", "ss_team"].includes(role)) {
    return role === "receptionist" ? "reception" : role;
  }
  return "staff";
}

async function loadSchedulesForDate(
  supabase: SupabaseClient,
  bookingDate: string,
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const { data, error } = await supabase
      .from("staff_schedules")
      .select("staff_id,status")
      .eq("schedule_date", bookingDate);
    if (error) return map;
    (data || []).forEach((row: { staff_id: string; status: string }) => {
      if (row.staff_id) map[row.staff_id] = row.status;
    });
  } catch {
    /* table may not exist yet */
  }
  return map;
}

function statusForDate(
  row: DbStaff,
  schedules: Record<string, string>,
  bookingDate: string,
): string {
  if (schedules[row.id]) {
    return schedules[row.id] === "on" ? "on" : "off";
  }
  const workDays = parseWorkDays(row.work_days);
  const weekDay = calcWeekDay(bookingDate);
  return workDays.includes(weekDay) ? "on" : "off";
}

function mapDbService(row: DbService): Service {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    duration: Number(row.duration),
    type: row.type || "single",
  };
}

async function fetchActiveServices(
  supabase: SupabaseClient,
) {
  let result = await supabase
    .from("services")
    .select("id,name,price,duration,type,active,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (result.error && /active/i.test(result.error.message || "")) {
    result = await supabase
      .from("services")
      .select("id,name,price,duration,type,active,sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (result.data) {
      result.data = result.data.filter((row) => row.active !== false);
    }
  }

  return {
    data: (result.data as DbService[] | null) ?? null,
    error: result.error,
  };
}

export async function loadServices(supabase: SupabaseClient): Promise<Service[]> {
  const { data, error } = await fetchActiveServices(supabase);

  if (error) {
    console.error("loadServices:", error);
    return dedupeServices(FALLBACK_SERVICES);
  }

  if (!data?.length) return dedupeServices(FALLBACK_SERVICES);

  return dedupeServices(data.map(mapDbService));
}

export async function loadStaff(supabase: SupabaseClient): Promise<Staff[]> {
  return loadStaffForDate(supabase, new Date().toISOString().slice(0, 10));
}

export async function loadStaffForDate(
  supabase: SupabaseClient,
  bookingDate: string,
): Promise<Staff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id,name,full_name,status,show_in_booking,auth_role,role,sort_order,work_days")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return FALLBACK_STAFF.filter((s) => s.status === "on");
  }

  const schedules = await loadSchedulesForDate(supabase, bookingDate);

  return (data as DbStaff[])
    .filter((row) => resolveStaffAuthRole(row) === "staff")
    .filter((row) => row.show_in_booking !== false)
    .map((row) => ({
      id: row.id,
      name: row.name,
      full_name: row.full_name || row.name,
      status: statusForDate(row, schedules, bookingDate),
      sort_order: Number(row.sort_order) || 0,
      auth_role: resolveStaffAuthRole(row),
    }))
    .filter((row) => row.status === "on")
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
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
    .select("id,booking_date,h,m,dur,staff_col,staff")
    .eq("booking_date", bookingDate);

  if (error || !data) return [];

  return (data as DbBooking[]).map((row) => ({
    id: row.id,
    bookingDate: row.booking_date,
    h: Number(row.h),
    m: Number(row.m),
    dur: Number(row.dur),
    col: Number(row.staff_col) || 1,
    staff: row.staff || "",
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
