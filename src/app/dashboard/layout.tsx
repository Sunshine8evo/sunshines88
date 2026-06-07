import type { CSSProperties } from "react";
import type { Metadata } from "next";

import "@/app/shop/[slug]/dashboard.css";
import { dmSansClass } from "@/lib/fonts";

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
      className={dmSansClass}
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
