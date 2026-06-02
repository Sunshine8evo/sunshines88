import type { SupabaseClient } from "@supabase/supabase-js";

type BookingRow = Record<string, unknown>;

const SCHEMA_FIX_HINT =
  "Schema mismatch — run supabase-bookings-columns-fix.sql in Supabase SQL Editor";

function stripMissingColumn(payload: BookingRow, message: string): boolean {
  const colMatch = message.match(/Could not find the '(\w+)' column/i);
  if (!colMatch) return false;
  const col = colMatch[1];
  if (!Object.prototype.hasOwnProperty.call(payload, col)) return false;
  delete payload[col];
  return true;
}

export async function insertBookingRow(
  supabase: SupabaseClient,
  row: BookingRow,
): Promise<void> {
  let payload = { ...row };
  for (let attempt = 0; attempt < 20; attempt++) {
    const { error } = await supabase.from("bookings").insert(payload);
    if (!error) return;
    if (stripMissingColumn(payload, error.message || "")) continue;
    throw error;
  }
  throw new Error(SCHEMA_FIX_HINT);
}

export async function updateBookingRow(
  supabase: SupabaseClient,
  id: string,
  row: BookingRow,
): Promise<void> {
  let payload = { ...row };
  for (let attempt = 0; attempt < 20; attempt++) {
    const { error } = await supabase.from("bookings").update(payload).eq("id", id);
    if (!error) return;
    if (stripMissingColumn(payload, error.message || "")) continue;
    throw error;
  }
  throw new Error(SCHEMA_FIX_HINT);
}
