import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

import type {
  CreateTenantPayload,
  StripeBillingInput,
  Tenant,
  TenantPlan,
} from "./types";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function listTenants(): Promise<Tenant[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        "id,slug,shop_name,owner_name,owner_email,plan,primary_color,secondary_color,created_at",
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Tenant[];
  } catch {
    return [];
  }
}

const BUILTIN_TENANTS: Record<string, Tenant> = {
  sunshinetest: {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "sunshinetest",
    shop_name: "Sunshine Test",
    owner_name: "Sunshines1",
    owner_email: "sunshines1@sunshines88.com",
    plan: "trial",
    primary_color: "#e87baa",
    secondary_color: "#7c5aad",
    created_at: new Date(0).toISOString(),
  },
};

export async function getTenantById(id: string): Promise<Tenant | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        "id,slug,shop_name,owner_name,owner_email,plan,primary_color,secondary_color,created_at,plan_status,stripe_customer_id,trial_ends_at",
      )
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();

    if (!error && data) return data as Tenant;
    return null;
  } catch {
    return null;
  }
}

// React cache() dedupes the lookup between generateMetadata and the page
// render within a single request.
export const getTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const normalized = slug.trim().toLowerCase();
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        "id,slug,shop_name,owner_name,owner_email,plan,primary_color,secondary_color,created_at",
      )
      .eq("slug", normalized)
      .eq("status", "active")
      .maybeSingle();

    if (!error && data) return data as Tenant;
    return BUILTIN_TENANTS[normalized] ?? null;
  } catch {
    return BUILTIN_TENANTS[normalized] ?? null;
  }
});

function mapPlanLabel(label?: string): TenantPlan {
  switch (label?.trim().toLowerCase()) {
    case "essential":
      return "starter";
    case "professional":
      return "pro";
    case "enterprise":
      return "enterprise";
    default:
      return "trial";
  }
}

export async function createTenant(
  payload: CreateTenantPayload,
  stripeBilling?: StripeBillingInput,
): Promise<{ tenant: Tenant; tempPassword: string } | { error: string }> {
  const shopName = payload.businessName.trim();
  const ownerName = payload.ownerName.trim();
  const ownerEmail = payload.ownerEmail.trim().toLowerCase();
  const plan: TenantPlan =
    payload.plan ?? mapPlanLabel(payload.planLabel);

  if (!shopName || !ownerName || !ownerEmail) {
    return { error: "Business name, owner name, and email are required." };
  }

  let slug = payload.slug ? slugify(payload.slug) : slugify(shopName);
  if (!slug) slug = `shop-${Date.now()}`;

  const tempPassword = `Ss${Math.random().toString(36).slice(2, 10)}!`;

  try {
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      if (payload.slug) {
        return { error: "This booking URL is already taken. Please choose another slug." };
      }
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const insertRow: Record<string, unknown> = {
      slug,
      shop_name: shopName,
      owner_name: ownerName,
      owner_email: ownerEmail,
      plan,
      billing_email: ownerEmail,
    };

    if (payload.phone?.trim()) {
      insertRow.shop_phone = payload.phone.trim();
    }

    if (stripeBilling) {
      insertRow.stripe_customer_id = stripeBilling.customerId;
      insertRow.stripe_subscription_id = stripeBilling.subscriptionId;
      insertRow.stripe_price_id = stripeBilling.priceId;
      insertRow.plan_status = stripeBilling.planStatus;
      insertRow.trial_ends_at = stripeBilling.trialEndsAt;
    }

    const { data: tenant, error: insertError } = await supabase
      .from("tenants")
      .insert(insertRow)
      .select(
        "id,slug,shop_name,owner_name,owner_email,plan,primary_color,secondary_color,created_at,plan_status,stripe_customer_id,trial_ends_at",
      )
      .single();

    if (insertError || !tenant) {
      return { error: insertError?.message ?? "Could not create tenant." };
    }

    const { error: authError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: "owner",
        tenant_id: tenant.id,
        slug: tenant.slug,
        name: ownerName,
      },
    });

    if (authError) {
      await supabase.from("tenants").delete().eq("id", tenant.id);
      return { error: authError.message };
    }

    return { tenant: tenant as Tenant, tempPassword };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tenant creation failed.";
    return { error: message };
  }
}
