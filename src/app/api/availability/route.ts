import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Availability API is not wired yet. Slots are loaded client-side from Supabase.",
    },
    { status: 501 },
  );
}
