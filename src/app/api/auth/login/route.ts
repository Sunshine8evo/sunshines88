import { NextResponse } from "next/server";

import { isSunshines88Email } from "@/lib/auth/roles";
import { loginStaff } from "@/lib/auth/service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const user = await loginStaff(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 401 },
      );
    }

    if (!isSunshines88Email(user.email)) {
      return NextResponse.json(
        {
          error:
            "Sign-in is only allowed for @sunshines88.com accounts. Please use your Sunshine company email.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}
