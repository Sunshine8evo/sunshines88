import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { staffFreeLimit, type StripePlanKey } from "@/lib/stripe/plans";

type TenantBillingRow = {
  id: string;
  plan: string;
  staff_count: number | null;
  stripe_subscription_id: string | null;
  stripe_staff_subscription_item_id: string | null;
};

function planKeyFromDbPlan(plan: string): StripePlanKey {
  switch (plan) {
    case "starter":
      return "essential";
    case "pro":
      return "professional";
    case "enterprise":
      return "enterprise";
    default:
      return "essential";
  }
}

export async function addStaffSeat(tenantId: string) {
  const supabase = createAdminClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, plan, staff_count, stripe_subscription_id, stripe_staff_subscription_item_id")
    .eq("id", tenantId)
    .single();

  if (error || !tenant) throw new Error("Tenant not found.");

  const row = tenant as TenantBillingRow;
  const planKey = planKeyFromDbPlan(row.plan);
  const freeLimit = staffFreeLimit(planKey);
  const currentStaff = row.staff_count ?? 0;

  if (currentStaff < freeLimit) {
    await supabase
      .from("tenants")
      .update({ staff_count: currentStaff + 1 })
      .eq("id", tenantId);
    return { charged: false, newCount: currentStaff + 1, extraSeats: 0 };
  }

  if (!isStripeConfigured() || !row.stripe_subscription_id) {
    await supabase
      .from("tenants")
      .update({ staff_count: currentStaff + 1 })
      .eq("id", tenantId);
    return { charged: false, newCount: currentStaff + 1, extraSeats: currentStaff + 1 - freeLimit };
  }

  const staffPriceId = process.env.STRIPE_PRICE_ADDITIONAL_STAFF?.trim();
  if (!staffPriceId) {
    throw new Error("STRIPE_PRICE_ADDITIONAL_STAFF is not configured.");
  }

  const stripe = getStripe();
  const extraSeats = currentStaff - freeLimit + 1;

  if (row.stripe_staff_subscription_item_id) {
    await stripe.subscriptionItems.update(row.stripe_staff_subscription_item_id, {
      quantity: extraSeats,
    });
  } else {
    const item = await stripe.subscriptionItems.create({
      subscription: row.stripe_subscription_id,
      price: staffPriceId,
      quantity: extraSeats,
    });
    await supabase
      .from("tenants")
      .update({ stripe_staff_subscription_item_id: item.id })
      .eq("id", tenantId);
  }

  await supabase
    .from("tenants")
    .update({ staff_count: currentStaff + 1 })
    .eq("id", tenantId);

  return {
    charged: true,
    extraSeats,
    chargeAmount: extraSeats * 5,
    newCount: currentStaff + 1,
  };
}

export async function removeStaffSeat(tenantId: string) {
  const supabase = createAdminClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, plan, staff_count, stripe_subscription_id, stripe_staff_subscription_item_id")
    .eq("id", tenantId)
    .single();

  if (error || !tenant) throw new Error("Tenant not found.");

  const row = tenant as TenantBillingRow;
  const planKey = planKeyFromDbPlan(row.plan);
  const freeLimit = staffFreeLimit(planKey);
  const currentStaff = row.staff_count ?? 0;
  const newCount = Math.max(0, currentStaff - 1);
  const newExtra = Math.max(0, newCount - freeLimit);

  if (isStripeConfigured() && row.stripe_staff_subscription_item_id) {
    const stripe = getStripe();
    if (newExtra === 0) {
      await stripe.subscriptionItems.del(row.stripe_staff_subscription_item_id, {
        proration_behavior: "create_prorations",
      });
      await supabase
        .from("tenants")
        .update({ stripe_staff_subscription_item_id: null, staff_count: newCount })
        .eq("id", tenantId);
    } else {
      await stripe.subscriptionItems.update(row.stripe_staff_subscription_item_id, {
        quantity: newExtra,
        proration_behavior: "create_prorations",
      });
      await supabase.from("tenants").update({ staff_count: newCount }).eq("id", tenantId);
    }
  } else {
    await supabase.from("tenants").update({ staff_count: newCount }).eq("id", tenantId);
  }

  return { newCount, newExtra, charged: newExtra > 0 };
}
