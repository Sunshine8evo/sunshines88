import { NextResponse } from "next/server";

import { sendWelcomeEmail } from "@/lib/email/send-welcome-email";
import { createTenant } from "@/lib/tenants/db";
import type { CreateTenantPayload } from "@/lib/tenants/types";
import {
  getPriceId,
  getStripe,
  isStripeConfigured,
  planLabelToStripeKey,
} from "@/lib/stripe";
import { createTrialSubscription } from "@/lib/stripe/subscriptions";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTenantPayload;
    const planKey = planLabelToStripeKey(body.planLabel);

    let stripeBilling;
    let clientSecret: string | null = null;

    if (isStripeConfigured() && getPriceId(planKey)) {
      try {
        const stripeResult = await createTrialSubscription({
          planKey,
          email: body.ownerEmail.trim().toLowerCase(),
          ownerName: body.ownerName.trim(),
          phone: body.phone?.trim(),
          shopName: body.businessName.trim(),
          slug: body.slug?.trim() || body.businessName.trim(),
        });
        stripeBilling = {
          customerId: stripeResult.customerId,
          subscriptionId: stripeResult.subscriptionId,
          priceId: stripeResult.priceId,
          trialEndsAt: stripeResult.trialEndsAt,
          planStatus: stripeResult.planStatus,
        };
        clientSecret = stripeResult.clientSecret;
      } catch (stripeErr) {
        console.error("Stripe subscription creation failed:", stripeErr);
        return NextResponse.json(
          { error: "Unable to start subscription. Check Stripe configuration." },
          { status: 500 },
        );
      }
    }

    const result = await createTenant(body, stripeBilling);

    if ("error" in result) {
      if (stripeBilling) {
        try {
          const stripe = getStripe();
          await stripe.subscriptions.cancel(stripeBilling.subscriptionId);
          await stripe.customers.del(stripeBilling.customerId);
        } catch (cleanupErr) {
          console.error("Stripe cleanup after tenant failure:", cleanupErr);
        }
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://www.sunshines88.com";

    try {
      await sendWelcomeEmail(result.tenant, result.tempPassword);
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      tenant: result.tenant,
      clientSecret,
      customerId: stripeBilling?.customerId ?? null,
      dashboardUrl: `${baseUrl}/dashboard-${result.tenant.slug}`,
      loginUrl: `${baseUrl}/login`,
      bookingUrl: `${baseUrl}/book/${result.tenant.slug}`,
    });
  } catch (error) {
    console.error("POST /api/tenants:", error);
    return NextResponse.json(
      { error: "Unable to create tenant right now." },
      { status: 500 },
    );
  }
}
