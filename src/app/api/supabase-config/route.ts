import { NextResponse } from "next/server";

export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ url, anonKey });
}
