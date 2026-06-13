import { notFound } from "next/navigation";

import BillingPortalButton from "@/components/billing/BillingPortalButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantBySlug } from "@/lib/tenants/db";
import { PLANS } from "@/lib/stripe/plans";

import IdleLogout from "../components/IdleLogout";

export default async function ShopBillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  let billing: {
    plan_status?: string | null;
    stripe_customer_id?: string | null;
    trial_ends_at?: string | null;
    staff_count?: number | null;
  } | null = null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("tenants")
      .select("plan_status, stripe_customer_id, trial_ends_at, staff_count, plan")
      .eq("slug", slug)
      .maybeSingle();
    billing = data;
  } catch {
    billing = null;
  }

  const planKey =
    tenant.plan === "starter"
      ? "essential"
      : tenant.plan === "pro"
        ? "professional"
        : tenant.plan === "enterprise"
          ? "enterprise"
          : "essential";

  const planInfo = PLANS[planKey];
  const status = billing?.plan_status ?? "trialing";
  const isBlocked = ["canceled", "suspended", "unpaid", "past_due"].includes(status);

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <IdleLogout timeoutMinutes={30} />
      <h1 className="text-2xl font-bold text-[#2d1a2e]">Billing</h1>
      <p className="mt-2 text-sm text-[#9a6d95]">{tenant.shop_name}</p>

      {isBlocked ? (
        <div className="mt-6 rounded-xl border border-[#f5c6d0] bg-[#fff5f7] p-5">
          <p className="text-sm font-semibold text-[#c0477a]">
            Your account needs attention ({status})
          </p>
          <p className="mt-2 text-sm text-[#6b6b7b]">
            Update your payment method or reactivate your subscription to restore full access.
          </p>
        </div>
      ) : null}

      <div className="mt-6 space-y-3 rounded-xl border border-[#f0d9ec] bg-white p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-[#9a6d95]">Plan</span>
          <span className="font-medium">{planInfo.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9a6d95]">Status</span>
          <span className="font-medium capitalize">{status}</span>
        </div>
        {billing?.trial_ends_at ? (
          <div className="flex justify-between">
            <span className="text-[#9a6d95]">Trial ends</span>
            <span className="font-medium">
              {new Date(billing.trial_ends_at).toLocaleDateString()}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-[#9a6d95]">Included staff</span>
          <span className="font-medium">{planInfo.freeStaff} free</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9a6d95]">Current staff</span>
          <span className="font-medium">{billing?.staff_count ?? 0}</span>
        </div>
      </div>

      {billing?.stripe_customer_id ? (
        <div className="mt-6">
          <BillingPortalButton
            slug={slug}
            customerId={billing.stripe_customer_id}
            label={isBlocked ? "Reactivate / Update payment" : "Manage billing & invoices"}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-[#9a6d95]">
          Stripe billing is not linked to this shop yet.
        </p>
      )}
    </div>
  );
}
