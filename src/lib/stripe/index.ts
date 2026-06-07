import Stripe from "stripe";

import { type StripePlanKey } from "./plans";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, { typescript: true });
  }
  return stripeClient;
}

export function getPriceId(planKey: StripePlanKey): string | null {
  const map: Record<StripePlanKey, string | undefined> = {
    essential: process.env.STRIPE_PRICE_ESSENTIAL,
    professional: process.env.STRIPE_PRICE_PROFESSIONAL,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return map[planKey]?.trim() || null;
}

export { PLANS, planLabelToStripeKey, stripeKeyFromPriceId, staffFreeLimit } from "./plans";
export type { PlanStatus, StripePlanKey } from "./plans";
