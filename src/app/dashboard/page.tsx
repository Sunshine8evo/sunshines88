import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import DashboardClient from "@/app/shop/[slug]/DashboardClient";
import { getUserMetadata } from "@/lib/auth/roles";
import { resolveDashboardSlug } from "@/lib/dashboard/constants";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenants/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Sunshine Booking System — shop dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard/login");
  }

  const { role, slug: userSlug } = getUserMetadata(user);
  const tenantSlug = resolveDashboardSlug(
    typeof role === "string" ? role : undefined,
    userSlug,
  );

  if (!tenantSlug) {
    redirect("/unauthorized");
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  return <DashboardClient tenant={tenant} shopAddress="Houston, TX" />;
}
