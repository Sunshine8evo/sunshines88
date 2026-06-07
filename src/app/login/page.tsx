import type { Metadata } from "next";

import { dmSansClass } from "@/lib/fonts";

import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Sunshine Booking",
};

export default function LoginPage() {
  return (
    <div className={dmSansClass}>
      <LoginClient />
    </div>
  );
}
