import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

import IntakeClient, {
  type IntakeBooking,
  type PreviousIntake,
} from "./IntakeClient";
import "./intake.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete your intake form",
  robots: { index: false, follow: false },
};

type BookingRow = {
  id: number | string;
  booking_date: string;
  h: number | null;
  m: number | null;
  dur: number | null;
  fname: string | null;
  lname: string | null;
  name: string | null;
  phone: string | null;
  svc: string | null;
  addon: string | null;
  staff: string | null;
  req: boolean | null;
  notes: string | null;
};

type IntakeFormRow = {
  submitted_at: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  conditions: string[] | null;
  other_condition: string | null;
  is_pregnant: boolean | null;
  pregnant_weeks: number | null;
  had_surgery: boolean | null;
  surgery_type: string | null;
  surgery_date: string | null;
  surgery_how_long: string | null;
  surgery_area: string | null;
  surgery_notes: string | null;
  medications: string | null;
  allergies: string | null;
  discomfort_areas: string[] | null;
  therapist_notes: string | null;
};

function mapPrevious(row: IntakeFormRow): PreviousIntake {
  return {
    submittedAt: row.submitted_at,
    emergencyName: row.emergency_name || "",
    emergencyPhone: row.emergency_phone || "",
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    otherCondition: row.other_condition || "",
    isPregnant: row.is_pregnant,
    pregnantWeeks: row.pregnant_weeks != null ? String(row.pregnant_weeks) : "",
    hadSurgery: row.had_surgery,
    surgeryType: row.surgery_type || "",
    surgeryDate: row.surgery_date || "",
    surgeryHowLong: row.surgery_how_long || "",
    surgeryArea: row.surgery_area || "",
    surgeryNotes: row.surgery_notes || "",
    medications: row.medications || "",
    allergies: row.allergies || "",
    discomfortAreas: Array.isArray(row.discomfort_areas) ? row.discomfort_areas : [],
    therapistNotes: row.therapist_notes || "",
  };
}

const PREVIEW_TOKENS = new Set(["preview", "sample", "demo"]);

function buildSamplePrevious(): PreviousIntake {
  return {
    submittedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    emergencyName: "John Doe",
    emergencyPhone: "(555) 987-6543",
    conditions: ["High blood pressure"],
    otherCondition: "",
    isPregnant: false,
    pregnantWeeks: "",
    hadSurgery: true,
    surgeryType: "Knee arthroscopy",
    surgeryDate: "2024-03",
    surgeryHowLong: "1–2 years ago",
    surgeryArea: "Right knee",
    surgeryNotes: "Occasional stiffness",
    medications: "None",
    allergies: "Lavender oil",
    discomfortAreas: ["Neck / shoulders", "Lower back"],
    therapistNotes: "Prefers firm pressure on shoulders",
  };
}

function buildSampleBooking(): IntakeBooking {
  const d = new Date(Date.now() + 3 * 86_400_000);
  const bookingDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    id: 0,
    bookingDate,
    h: 14,
    m: 0,
    durationMinutes: 90,
    firstName: "Jane",
    lastName: "Doe",
    name: "Jane Doe",
    phone: "(555) 123-4567",
    service: "Aromatherapy Massage",
    addons: "Hot Stones, Foot Scrub",
    therapist: "Jenny S.",
    requestedTherapist: true,
    specialRequests: "Prefer medium pressure",
  };
}

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Reserved tokens let SS System preview the form with sample data (no booking).
  if (PREVIEW_TOKENS.has(token.toLowerCase())) {
    return (
      <IntakeClient
        booking={buildSampleBooking()}
        token={token}
        alreadySubmitted={false}
        previousIntake={buildSamplePrevious()}
        preview
      />
    );
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    notFound();
  }

  const { data: bookingData, error } = await supabase
    .from("bookings")
    .select(
      "id,booking_date,h,m,dur,fname,lname,name,phone,svc,addon,staff,req,notes",
    )
    .eq("intake_token", token)
    .maybeSingle();

  const booking = bookingData as BookingRow | null;
  if (error || !booking) notFound();

  const { data: existingData } = await supabase
    .from("intake_forms")
    .select("submitted_at")
    .eq("token", token)
    .maybeSingle();

  const existing = existingData as { submitted_at: string | null } | null;
  const alreadySubmitted = Boolean(existing?.submitted_at);

  // Returning customer: pull their most recent submitted intake (matched by phone)
  // so we can offer "use existing / edit". Skip if this booking was already done.
  let previousIntake: PreviousIntake | null = null;
  const phone = (booking.phone || "").trim();
  if (!alreadySubmitted && phone) {
    const { data: phoneBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("phone", phone)
      .neq("id", booking.id);

    const ids = ((phoneBookings as { id: number | string }[] | null) || []).map(
      (b) => b.id,
    );

    if (ids.length) {
      const { data: prevData } = await supabase
        .from("intake_forms")
        .select("*")
        .in("booking_id", ids)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevData) previousIntake = mapPrevious(prevData as IntakeFormRow);
    }
  }

  const bookingProps: IntakeBooking = {
    id: booking.id,
    bookingDate: booking.booking_date,
    h: booking.h ?? 0,
    m: booking.m ?? 0,
    durationMinutes: booking.dur ?? 60,
    firstName: (booking.fname || "").trim(),
    lastName: (booking.lname || "").trim(),
    name: (booking.name || "").trim(),
    phone: (booking.phone || "").trim(),
    service: (booking.svc || "").trim(),
    addons: (booking.addon || "").trim(),
    therapist: (booking.staff || "").trim(),
    requestedTherapist: Boolean(booking.req),
    specialRequests: (booking.notes || "").trim(),
  };

  return (
    <IntakeClient
      booking={bookingProps}
      token={token}
      alreadySubmitted={alreadySubmitted}
      previousIntake={previousIntake}
    />
  );
}
