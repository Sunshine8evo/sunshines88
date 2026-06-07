import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";

import BookingFlowV5 from "@/components/booking/BookingFlowV5";
import { DEMO_LOCATIONS } from "@/components/booking/booking-flow-v5-data";
import { getTenantBySlug } from "@/lib/tenants/db";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

type BookSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BookSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const logoUrl =
    tenant && "logo_url" in tenant && typeof tenant.logo_url === "string"
      ? tenant.logo_url
      : null;

  return {
    title: tenant ? `${tenant.shop_name} — Book Now` : "Book Online",
    description: tenant
      ? `Book services at ${tenant.shop_name}`
      : "จองบริการ Spa & Salon ออนไลน์ที่ Sunshine",
    icons: {
      icon: logoUrl ?? "/favicon-32.png",
      apple: logoUrl ?? "/apple-touch-icon.png",
    },
  };
}

export default async function BookSlugPage({ params }: BookSlugPageProps) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  const isDemoShop =
    slug.toLowerCase().includes("test") || slug.toLowerCase().includes("sunshine");

  return (
    <div
      className={`${dmSans.className} ${cormorant.variable}`}
      style={
        {
          "--bf5-font-sans": "var(--font-dm-sans), 'DM Sans', sans-serif",
          "--bf5-font-serif": "var(--font-cormorant), 'Cormorant Garamond', serif",
        } as CSSProperties
      }
    >
      <BookingFlowV5
        shopName={tenant.shop_name}
        shopAddress={
          isDemoShop ? DEMO_LOCATIONS[0].addr : "Contact shop for address"
        }
        locations={isDemoShop ? DEMO_LOCATIONS : undefined}
        serifClassName={cormorant.className}
      />
    </div>
  );
}
