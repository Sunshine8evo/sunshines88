import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  sendPaymentFailedEmail,
  sendPaymentSuccessEmail,
  sendTrialEndingEmail,
} from "@/lib/email/billing-emails";
import { getStripe, isStripeConfigured, stripeKeyFromPriceId } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe/plans";
import {
  updateTenantByStripeCustomer,
  updateTenantBySubscriptionId,
} from "@/lib/tenants/billing";

export const runtime = "nodejs";

function mapSubscriptionStatus(status: string): string {
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "unpaid") return "unpaid";
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  return status;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await updateTenantByStripeCustomer(customerId, { plan_status: "active" });
          if (invoice.customer_email) {
            await sendPaymentSuccessEmail({
              email: invoice.customer_email,
              shopName: invoice.metadata?.shop_name ?? "your shop",
              amount: invoice.amount_paid
                ? `$${(invoice.amount_paid / 100).toFixed(2)}`
                : undefined,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await updateTenantByStripeCustomer(customerId, { plan_status: "past_due" });
          if (invoice.customer_email) {
            await sendPaymentFailedEmail({
              email: invoice.customer_email,
              shopName: invoice.metadata?.shop_name ?? "your shop",
            });
          }
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          const email =
            typeof customer === "object" && !customer.deleted
              ? customer.email
              : null;
          if (email && sub.trial_end) {
            await sendTrialEndingEmail({
              email,
              shopName: sub.metadata?.shop_name ?? "your shop",
              trialEnd: new Date(sub.trial_end * 1000).toLocaleDateString(),
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateTenantBySubscriptionId(sub.id, {
          plan_status: "canceled",
          subscription_ends_at: new Date().toISOString(),
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id;
        const planKey = priceId ? stripeKeyFromPriceId(priceId) : null;
        const dbPlan = planKey ? PLANS[planKey].dbPlan : undefined;
        let planStatus = mapSubscriptionStatus(sub.status);
        if (sub.status === "unpaid") planStatus = "suspended";

        await updateTenantBySubscriptionId(sub.id, {
          plan_status: planStatus,
          ...(priceId ? { stripe_price_id: priceId } : {}),
          ...(dbPlan ? { plan: dbPlan } : {}),
          ...(sub.trial_end
            ? { trial_ends_at: new Date(sub.trial_end * 1000).toISOString() }
            : {}),
          ...(sub.cancel_at
            ? { subscription_ends_at: new Date(sub.cancel_at * 1000).toISOString() }
            : {}),
        });
        break;
      }

      default:
        break;
    }
  } catch (handlerErr) {
    console.error(`Stripe webhook handler error (${event.type}):`, handlerErr);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
