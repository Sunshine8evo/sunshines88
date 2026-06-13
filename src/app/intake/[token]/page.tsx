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
  id: string;
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

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
