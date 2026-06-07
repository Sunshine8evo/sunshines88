import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import DashboardClient from "@/app/shop/[slug]/DashboardClient";
import { getUserMetadata, isSSSystem } from "@/lib/auth/roles";
import { DEFAULT_DASHBOARD_SLUG } from "@/lib/dashboard/constants";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenants/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Sunshine Booking System — S System dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { role, slug: userSlug } = getUserMetadata(user);

  if (!isSSSystem(role)) {
    if (userSlug) {
      redirect(`/dashboard-${userSlug}`);
    }
    redirect("/unauthorized");
  }

  const tenantSlug = userSlug ?? DEFAULT_DASHBOARD_SLUG;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  return <DashboardClient tenant={tenant} shopAddress="Houston, TX" />;
}
