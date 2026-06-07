import { NextResponse } from "next/server";

import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getTenantBillingBySlug } from "@/lib/tenants/billing";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { slug?: string; customerId?: string };
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://www.sunshines88.com";

    let customerId = body.customerId?.trim();

    if (!customerId && body.slug) {
      const tenant = await getTenantBillingBySlug(body.slug);
      customerId = tenant?.stripe_customer_id ?? undefined;
    }

    if (!customerId) {
      return NextResponse.json({ error: "Stripe customer not found." }, { status: 404 });
    }

    const slug = body.slug?.trim() ?? "";
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: slug
        ? `${baseUrl}/shop/${slug}/billing`
        : `${baseUrl}/dashboard/login`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/stripe/portal:", error);
    return NextResponse.json(
      { error: "Unable to open billing portal." },
      { status: 500 },
    );
  }
}
