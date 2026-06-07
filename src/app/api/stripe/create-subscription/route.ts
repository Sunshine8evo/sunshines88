import { NextResponse } from "next/server";

import { getPriceId, isStripeConfigured, planLabelToStripeKey } from "@/lib/stripe";
import { createTrialSubscription } from "@/lib/stripe/subscriptions";

/** Attach a 15-day trial subscription to an existing signup (optional standalone endpoint). */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      planLabel?: string;
      email?: string;
      ownerName?: string;
      phone?: string;
      shopName?: string;
      slug?: string;
    };

    const planKey = planLabelToStripeKey(body.planLabel);
    if (!getPriceId(planKey)) {
      return NextResponse.json({ error: "Plan price not configured." }, { status: 400 });
    }

    if (!body.email || !body.ownerName || !body.shopName || !body.slug) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await createTrialSubscription({
      planKey,
      email: body.email.trim().toLowerCase(),
      ownerName: body.ownerName.trim(),
      phone: body.phone?.trim(),
      shopName: body.shopName.trim(),
      slug: body.slug.trim(),
    });

    return NextResponse.json({
      success: true,
      customerId: result.customerId,
      subscriptionId: result.subscriptionId,
      clientSecret: result.clientSecret,
      trialEndsAt: result.trialEndsAt,
    });
  } catch (error) {
    console.error("POST /api/stripe/create-subscription:", error);
    return NextResponse.json(
      { error: "Unable to create subscription." },
      { status: 500 },
    );
  }
}
