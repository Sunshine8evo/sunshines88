import type { Metadata } from "next";

import ComingSoonPage from "@/components/marketing/ComingSoonPage";

export const metadata: Metadata = {
  title: "Coming Soon",
  description: "The all-in-one online booking system for service businesses.",
};

export const dynamic = "force-static";

export default function Home() {
  return <ComingSoonPage />;
}
