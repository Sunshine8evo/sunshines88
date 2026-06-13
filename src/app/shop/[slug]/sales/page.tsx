import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getUserMetadata, isSSSystem, normalizeRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenants/db";

import SalesClient from "./SalesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sales Summary",
};

export default async function ShopSalesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { role } = getUserMetadata(user);
  const allowed = isSSSystem(role) || normalizeRole(role) === "owner";
  if (!allowed) {
    redirect(`/dashboard-${slug}`);
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return <SalesClient slug={slug} shopName={tenant.shop_name} />;
}
