import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

import IntakeClient, { type IntakeBooking } from "./IntakeClient";
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

const PREVIEW_TOKENS = new Set(["preview", "sample", "demo"]);

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
      alreadySubmitted={Boolean(existing?.submitted_at)}
    />
  );
}
