import { Resend } from "resend";

import type { Tenant } from "@/lib/tenants/types";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendWelcomeEmail(
  tenant: Tenant,
  tempPassword: string,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping welcome email.");
    return;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.sunshines88.com";

  const from = process.env.AUTH_FROM_EMAIL ?? "Sunshine System <noreply@sunshines88.com>";

  await resend.emails.send({
    from,
    to: tenant.owner_email,
    subject: "Welcome to Sunshine Booking 🌞 — Your account is ready!",
    text: `Hi ${tenant.owner_name},

Your Sunshine Booking account has been created.

Shop: ${tenant.shop_name}
Plan: ${tenant.plan}

🔗 Your booking link (share with customers):
${baseUrl}/book/${tenant.slug}

🔐 Your dashboard login:
${baseUrl}/dashboard-${tenant.slug}/login

Username: ${tenant.owner_email}
Temporary password: ${tempPassword}

Please log in and change your password on first login.

— Sunshine Evolution Technology Team
${baseUrl}`,
  });
}
