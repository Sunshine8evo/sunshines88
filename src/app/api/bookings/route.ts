import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Booking API is not wired yet. Use the in-app booking flow or legacy booking.html.",
    },
    { status: 501 },
  );
}
