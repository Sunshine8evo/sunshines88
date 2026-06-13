import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type IntakePayload = {
  token?: unknown;
  emergency_name?: unknown;
  emergency_phone?: unknown;
  conditions?: unknown;
  other_condition?: unknown;
  is_pregnant?: unknown;
  pregnant_weeks?: unknown;
  had_surgery?: unknown;
  surgery_type?: unknown;
  surgery_date?: unknown;
  surgery_how_long?: unknown;
  surgery_area?: unknown;
  surgery_notes?: unknown;
  medications?: unknown;
  allergies?: unknown;
  discomfort_areas?: unknown;
  therapist_notes?: unknown;
  consent_agreed?: unknown;
  policy_agreed?: unknown;
  signature_data?: unknown;
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strOrNull = (v: unknown): string | null => {
  const s = str(v);
  return s ? s : null;
};
const boolOrNull = (v: unknown): boolean | null =>
  typeof v === "boolean" ? v : null;
const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const intOrNull = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export async function POST(request: Request) {
  let body: IntakePayload;
  try {
    body = (await request.json()) as IntakePayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = str(body.token);
  if (!token) {
    return NextResponse.json({ error: "Missing booking token." }, { status: 400 });
  }

  if (body.consent_agreed !== true) {
    return NextResponse.json(
      { error: "Consent confirmation is required." },
      { status: 400 },
    );
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server is not configured. Please try again later." },
      { status: 500 },
    );
  }

  // The token is the gate: it must match a real booking.
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .select("id")
    .eq("intake_token", token)
    .maybeSingle();

  if (bookingErr || !booking) {
    return NextResponse.json(
      { error: "This intake link is invalid or has expired." },
      { status: 404 },
    );
  }

  const hadSurgery = boolOrNull(body.had_surgery);
  const isPregnant = boolOrNull(body.is_pregnant);

  const row = {
    booking_id: booking.id as number,
    token,
    submitted_at: new Date().toISOString(),
    emergency_name: strOrNull(body.emergency_name),
    emergency_phone: strOrNull(body.emergency_phone),
    conditions: strArray(body.conditions),
    other_condition: strOrNull(body.other_condition),
    is_pregnant: isPregnant,
    pregnant_weeks: isPregnant ? intOrNull(body.pregnant_weeks) : null,
    had_surgery: hadSurgery,
    surgery_type: hadSurgery ? strOrNull(body.surgery_type) : null,
    surgery_date: hadSurgery ? strOrNull(body.surgery_date) : null,
    surgery_how_long: hadSurgery ? strOrNull(body.surgery_how_long) : null,
    surgery_area: hadSurgery ? strOrNull(body.surgery_area) : null,
    surgery_notes: hadSurgery ? strOrNull(body.surgery_notes) : null,
    medications: strOrNull(body.medications),
    allergies: strOrNull(body.allergies),
    discomfort_areas: strArray(body.discomfort_areas),
    therapist_notes: strOrNull(body.therapist_notes),
    consent_agreed: true,
    policy_agreed: body.policy_agreed === true,
    signature_data: strOrNull(body.signature_data),
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabase
    .from("intake_forms")
    .upsert(row, { onConflict: "token" });

  if (upsertErr) {
    return NextResponse.json(
      { error: "Could not save your form. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
