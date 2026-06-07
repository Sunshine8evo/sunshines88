import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

import LandingPage from "@/components/marketing/LandingPage";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sunshine Booking — The All-in-One Online Booking System",
  description:
    "The all-in-one online booking system for spas, salons, and service businesses.",
};

export const dynamic = "force-static";

export default function LandingPreviewPage() {
  return (
    <div className={`${dmSans.className} w-full min-w-0`}>
      <LandingPage serifClassName={playfair.className} />
    </div>
  );
}
