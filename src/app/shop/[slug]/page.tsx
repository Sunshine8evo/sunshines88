import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DashboardClient from "./DashboardClient";
import { getTenantBySlug } from "@/lib/tenants/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  return {
    title: tenant ? `${tenant.shop_name} Dashboard` : "Shop Dashboard",
  };
}

export default async function ShopDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return <DashboardClient tenant={tenant} />;
}
