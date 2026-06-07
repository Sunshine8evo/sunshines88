export type StripePlanKey = "essential" | "professional" | "enterprise";

export type PlanStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "suspended"
  | "unpaid";

export const PLANS = {
  essential: {
    name: "Essential",
    price: 299,
    trialDays: 15,
    txFeePercent: 2,
    maxStaff: 8,
    freeStaff: 3,
    dbPlan: "starter" as const,
  },
  professional: {
    name: "Professional",
    price: 349,
    trialDays: 15,
    txFeePercent: 1,
    maxStaff: 20,
    freeStaff: 12,
    dbPlan: "pro" as const,
  },
  enterprise: {
    name: "Enterprise",
    price: 459,
    trialDays: 15,
    txFeePercent: 0,
    maxStaff: 999,
    freeStaff: 999,
    dbPlan: "enterprise" as const,
  },
} as const;

export function planLabelToStripeKey(label?: string): StripePlanKey {
  switch (label?.trim().toLowerCase()) {
    case "essential":
      return "essential";
    case "professional":
      return "professional";
    case "enterprise":
      return "enterprise";
    default:
      return "professional";
  }
}

export function stripeKeyFromPriceId(priceId: string): StripePlanKey | null {
  const essential = process.env.STRIPE_PRICE_ESSENTIAL;
  const professional = process.env.STRIPE_PRICE_PROFESSIONAL;
  const enterprise = process.env.STRIPE_PRICE_ENTERPRISE;
  if (priceId === essential) return "essential";
  if (priceId === professional) return "professional";
  if (priceId === enterprise) return "enterprise";
  return null;
}

export function staffFreeLimit(planKey: StripePlanKey): number {
  const envMap: Record<StripePlanKey, string | undefined> = {
    essential: process.env.STAFF_LIMIT_ESSENTIAL,
    professional: process.env.STAFF_LIMIT_PROFESSIONAL,
    enterprise: process.env.STAFF_LIMIT_ENTERPRISE,
  };
  const fromEnv = envMap[planKey];
  if (fromEnv) return parseInt(fromEnv, 10);
  return PLANS[planKey].freeStaff;
}
