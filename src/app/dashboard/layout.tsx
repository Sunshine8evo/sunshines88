import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";

import "@/app/shop/[slug]/dashboard.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Sunshine Booking System",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}
      style={
        {
          "--shop-primary": "#e87baa",
          "--shop-secondary": "#7c5aad",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
