import type { CSSProperties } from "react";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";

import { getTenantBySlug } from "@/lib/tenants/db";

import "./dashboard.css";

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

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}
      style={
        {
          "--shop-primary": tenant.primary_color ?? "#e87baa",
          "--shop-secondary": tenant.secondary_color ?? "#7c5aad",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
