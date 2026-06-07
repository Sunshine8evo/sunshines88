import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL
      ? `Sunshine Booking <${process.env.RESEND_FROM_EMAIL}>`
      : process.env.AUTH_FROM_EMAIL ?? "Sunshine System <noreply@sunshines88.com>"
  );
}

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.sunshines88.com";

export async function sendTrialEndingEmail(input: {
  email: string;
  shopName: string;
  trialEnd: string;
  portalUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: fromAddress(),
    to: input.email,
    subject: "⏰ Your Sunshine Booking trial ends in 3 days",
    text: `Hi,

Your 15-day free trial for ${input.shopName} on Sunshine Booking ends on ${input.trialEnd}.

After your trial, your card on file will be charged automatically for your selected plan.

Update payment method: ${input.portalUrl ?? `${baseUrl()}/login`}

— Sunshine Evolution Technology`,
  });
}

export async function sendPaymentFailedEmail(input: {
  email: string;
  shopName: string;
  portalUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: fromAddress(),
    to: input.email,
    subject: "⚠️ Payment failed — Update your payment method",
    text: `Hi,

We could not process your Sunshine Booking subscription payment for ${input.shopName}.

Please update your payment method to avoid service interruption:
${input.portalUrl ?? `${baseUrl()}/login`}

— Sunshine Evolution Technology`,
  });
}

export async function sendPaymentSuccessEmail(input: {
  email: string;
  shopName: string;
  amount?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: fromAddress(),
    to: input.email,
    subject: "✅ Payment confirmed — Sunshine Booking",
    text: `Hi,

Your Sunshine Booking payment for ${input.shopName} was successful${input.amount ? ` (${input.amount})` : ""}.

Thank you for your business!

— Sunshine Evolution Technology`,
  });
}
