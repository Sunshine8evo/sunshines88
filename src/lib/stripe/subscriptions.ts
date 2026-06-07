import type Stripe from "stripe";

import { getPriceId, getStripe } from "./index";
import { PLANS, type StripePlanKey } from "./plans";

export type StripeSignupResult = {
  customerId: string;
  subscriptionId: string;
  priceId: string;
  clientSecret: string | null;
  trialEndsAt: string;
  planStatus: string;
};

export async function createTrialSubscription(input: {
  planKey: StripePlanKey;
  email: string;
  ownerName: string;
  phone?: string;
  shopName: string;
  slug: string;
}): Promise<StripeSignupResult> {
  const stripe = getStripe();
  const priceId = getPriceId(input.planKey);
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for plan: ${input.planKey}`);
  }

  const trialDays = PLANS[input.planKey].trialDays;

  const customer = await stripe.customers.create({
    name: input.ownerName,
    email: input.email,
    phone: input.phone || undefined,
    metadata: {
      shop_name: input.shopName,
      slug: input.slug,
      plan: input.planKey,
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    trial_settings: {
      end_behavior: { missing_payment_method: "cancel" },
    },
    metadata: { slug: input.slug, plan: input.planKey },
    expand: ["pending_setup_intent", "latest_invoice.payment_intent"],
  });

  const clientSecret = extractClientSecret(subscription);
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    customerId: customer.id,
    subscriptionId: subscription.id,
    priceId,
    clientSecret,
    trialEndsAt,
    planStatus: subscription.status,
  };
}

function extractClientSecret(subscription: Stripe.Subscription): string | null {
  const setupIntent = subscription.pending_setup_intent;
  if (setupIntent && typeof setupIntent === "object" && setupIntent.client_secret) {
    return setupIntent.client_secret;
  }

  const invoice = subscription.latest_invoice;
  if (invoice && typeof invoice === "object") {
    const pi = (invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null })
      .payment_intent;
    if (pi && typeof pi === "object" && pi.client_secret) {
      return pi.client_secret;
    }
  }

  return null;
}
