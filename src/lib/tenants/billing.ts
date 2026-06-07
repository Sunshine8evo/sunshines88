import { createAdminClient } from "@/lib/supabase/admin";

import type { PlanStatus } from "./types";

export type TenantBilling = {
  slug: string;
  plan_status: PlanStatus | null;
  stripe_customer_id: string | null;
  status: string;
};

const BLOCKED_STATUSES: PlanStatus[] = ["canceled", "suspended", "unpaid"];

export function isBillingBlocked(status: string | null | undefined): boolean {
  if (!status) return false;
  return BLOCKED_STATUSES.includes(status as PlanStatus);
}

export async function getTenantBillingBySlug(
  slug: string,
): Promise<TenantBilling | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("slug, plan_status, stripe_customer_id, status")
      .eq("slug", slug.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    return data as TenantBilling;
  } catch {
    return null;
  }
}

export async function updateTenantByStripeCustomer(
  customerId: string,
  patch: Record<string, unknown>,
) {
  const supabase = createAdminClient();
  await supabase.from("tenants").update(patch).eq("stripe_customer_id", customerId);
}

export async function updateTenantBySubscriptionId(
  subscriptionId: string,
  patch: Record<string, unknown>,
) {
  const supabase = createAdminClient();
  await supabase.from("tenants").update(patch).eq("stripe_subscription_id", subscriptionId);
}
