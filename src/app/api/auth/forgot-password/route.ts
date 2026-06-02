import { NextResponse } from "next/server";

import { createPasswordResetToken } from "@/lib/auth/service";
import { sendPasswordResetEmail } from "@/lib/email/send-reset-email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim() ?? "";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const reset = await createPasswordResetToken(email);

    if (reset) {
      try {
        await sendPasswordResetEmail(reset.user.email, reset.token);
      } catch (error) {
        console.error("POST /api/auth/forgot-password send:", error);
        return NextResponse.json(
          {
            error:
              "Unable to send reset email right now. Please contact support.",
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({
      message:
        "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password:", error);
    return NextResponse.json(
      { error: "Unable to process request right now." },
      { status: 500 },
    );
  }
}
