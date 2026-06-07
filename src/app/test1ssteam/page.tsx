import type { Metadata } from "next";

import LandingPage from "@/components/marketing/LandingPage";
import { dmSans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Sunshine Booking — The All-in-One Online Booking System",
  description:
    "The all-in-one online booking system for spas, salons, and service businesses.",
};

export const dynamic = "force-static";

export default function LandingPreviewPage() {
  return (
    <div className={`${dmSans.className} w-full min-w-0`}>
      <LandingPage />
    </div>
  );
}
