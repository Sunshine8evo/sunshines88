import { Resend } from "resend";

import { getSiteUrl } from "@/lib/auth/service";

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.AUTH_FROM_EMAIL || "Sunshine System <onboarding@resend.dev>";
  const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Reset your Sunshine password",
    html: `
      <div style="font-family:'DM Sans',Arial,sans-serif;line-height:1.6;color:#1a1a1a;max-width:560px">
        <h2 style="color:#e85d7a;margin:0 0 12px">Sunshine System</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#e85d7a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">
            Reset Password
          </a>
        </p>
        <p style="font-size:13px;color:#666">This link expires in 1 hour.</p>
        <p style="font-size:13px;color:#666">If you did not request this, you can ignore this email.</p>
        <p style="font-size:12px;color:#999;word-break:break-all">${resetUrl}</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "Failed to send reset email");
  }
}
