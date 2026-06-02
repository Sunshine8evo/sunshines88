import { NextResponse } from "next/server";

import { resetStaffPassword } from "@/lib/auth/service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };

    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 },
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters." },
        { status: 400 },
      );
    }

    const ok = await resetStaffPassword(token, password);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("POST /api/auth/reset-password:", error);
    return NextResponse.json(
      { error: "Unable to reset password right now." },
      { status: 500 },
    );
  }
}
