import { normalizeRole } from "@/lib/auth/roles";
import { getSiteUrl } from "@/lib/auth/service";
import { sendOwnerPasswordResetEmail } from "@/lib/email/send-reset-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonServerClient } from "@/lib/supabase/anon-server";

type PhoneRow = { email?: string | null; phone?: string | null };

function normalizePhone(val: string): string {
  return val.replace(/\D/g, "");
}

function isPhone(val: string): boolean {
  const trimmed = val.trim();
  return /^[\d\s\-+().]+$/.test(trimmed) && /\d/.test(trimmed);
}

export async function resolveLoginEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (!isPhone(trimmed)) {
    return trimmed.includes("@") ? trimmed.toLowerCase() : null;
  }

  const digits = normalizePhone(trimmed);
  const clients = [createAdminClient, createAnonServerClient];

  for (const createClient of clients) {
    try {
      const supabase = createClient();

      const { data: exactMatch } = await supabase
        .from("staff_auth")
        .select("email")
        .eq("phone", trimmed)
        .maybeSingle();

      if (exactMatch?.email) return String(exactMatch.email).toLowerCase();

      const { data: authRows } = await supabase
        .from("staff_auth")
        .select("email,phone")
        .not("phone", "is", null);

      const authHit = (authRows as PhoneRow[] | null)?.find(
        (row) => row.phone && normalizePhone(row.phone) === digits,
      );
      if (authHit?.email) return authHit.email.toLowerCase();

      const { data: staffRows } = await supabase
        .from("staff")
        .select("email,phone")
        .not("phone", "is", null);

      const staffHit = (staffRows as PhoneRow[] | null)?.find(
        (row) => row.phone && normalizePhone(row.phone) === digits,
      );
      if (staffHit?.email) return staffHit.email.toLowerCase();
    } catch {
      /* try next client */
    }
  }

  return null;
}

async function findAuthUserByEmail(email: string) {
  const supabase = createAdminClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  const res = await fetch(
    `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { users?: Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }> };
  return (
    data.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ??
    null
  );
}

export type OwnerPasswordResetResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status: number };

export async function requestOwnerPasswordReset(
  identifier: string,
): Promise<OwnerPasswordResetResult> {
  const email = await resolveLoginEmail(identifier);

  if (!email) {
    return {
      ok: false,
      error: "Please enter a valid owner email address.",
      status: 400,
    };
  }

  const authUser = await findAuthUserByEmail(email);

  if (!authUser) {
    return {
      ok: true,
      message:
        "If an owner account exists for this email, a reset link has been sent.",
    };
  }

  const role = normalizeRole(
    typeof authUser.user_metadata?.role === "string"
      ? authUser.user_metadata.role
      : undefined,
  );

  if (role !== "owner") {
    return {
      ok: false,
      error: "Password reset is only available for business owner accounts.",
      status: 403,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${getSiteUrl()}/reset-password`,
    },
  });

  if (error || !data.properties?.action_link) {
    console.error("requestOwnerPasswordReset generateLink:", error);
    return {
      ok: false,
      error: "Unable to send reset email right now. Please try again later.",
      status: 503,
    };
  }

  try {
    await sendOwnerPasswordResetEmail(email, data.properties.action_link);
  } catch (sendError) {
    console.error("requestOwnerPasswordReset send:", sendError);
    return {
      ok: false,
      error: "Unable to send reset email right now. Please contact support.",
      status: 503,
    };
  }

  return {
    ok: true,
    message: "A password reset link has been sent to your owner email.",
  };
}
