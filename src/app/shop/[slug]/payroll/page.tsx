import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getUserMetadata, isSSSystem, normalizeRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenants/db";

import PayrollClient from "./PayrollClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payroll Summary",
};

type CommissionRow = {
  method?: string | null;
  rate?: number | string | null;
  price?: number | string | null;
  staff_target?: string | null;
};

// Read-only commission label from Settings (Commission Settings module).
async function resolveCommissionLabel(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("commissions")
      .select("method,rate,price,staff_target");
    const rows = (data ?? []) as CommissionRow[];
    if (!rows.length) return "—";

    const pick =
      rows.find((r) => (r.staff_target ?? "").toLowerCase() === "staff") ??
      rows.find((r) => (r.staff_target ?? "").toLowerCase() === "all") ??
      rows[0];

    if ((pick.method ?? "percent") === "flat") {
      return `$${Number(pick.price) || 0}/session`;
    }
    return `${Number(pick.rate) || 0}%`;
  } catch {
    return "—";
  }
}

export default async function ShopPayrollPage({
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

  const commissionLabel = await resolveCommissionLabel();

  return (
    <PayrollClient
      slug={slug}
      shopName={tenant.shop_name}
      commissionLabel={commissionLabel}
    />
  );
}
