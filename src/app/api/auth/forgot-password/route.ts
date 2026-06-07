import { NextResponse } from "next/server";

import { requestOwnerPasswordReset } from "@/lib/auth/owner-password-reset";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; identifier?: string };
    const identifier = (body.identifier ?? body.email ?? "").trim();

    if (!identifier) {
      return NextResponse.json(
        { error: "Please enter your email address." },
        { status: 400 },
      );
    }

    const result = await requestOwnerPasswordReset(identifier);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("POST /api/auth/forgot-password:", error);
    return NextResponse.json(
      { error: "Unable to process request right now." },
      { status: 500 },
    );
  }
}
