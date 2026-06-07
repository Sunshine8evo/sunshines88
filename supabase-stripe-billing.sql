-- Stripe subscription billing columns for tenants
-- Run in Supabase SQL Editor after supabase-tenants.sql

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'trialing'
  CHECK (plan_status IN ('trialing', 'active', 'past_due', 'canceled', 'suspended', 'unpaid'));
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS shop_phone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS staff_count INT DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_staff_subscription_item_id TEXT;

CREATE INDEX IF NOT EXISTS tenants_stripe_customer_idx ON public.tenants (stripe_customer_id);
CREATE INDEX IF NOT EXISTS tenants_stripe_subscription_idx ON public.tenants (stripe_subscription_id);
