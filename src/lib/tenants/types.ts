export type TenantPlan = "trial" | "starter" | "pro" | "enterprise";

export type PlanStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "suspended"
  | "unpaid";

export type Tenant = {
  id: string;
  slug: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  plan: TenantPlan;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  plan_status?: PlanStatus | null;
  stripe_customer_id?: string | null;
  trial_ends_at?: string | null;
};

export type CreateTenantPayload = {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  address?: string;
  businessType?: string;
  slug?: string;
  plan?: TenantPlan;
  planLabel?: string;
};

export type StripeBillingInput = {
  customerId: string;
  subscriptionId: string;
  priceId: string;
  trialEndsAt: string;
  planStatus: string;
};
