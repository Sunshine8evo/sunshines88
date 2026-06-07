import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import { dmSans } from "@/lib/fonts";
import { getTenantBySlug } from "@/lib/tenants/db";

import "./dashboard.css";

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
      className={dmSans.variable}
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
