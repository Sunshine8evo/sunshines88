-- Sunshine Booking — Role reset (ss_system | owner | staff)
-- Run in Supabase SQL Editor

-- 1) Migrate auth.users metadata roles
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "ss_system"}'::jsonb
WHERE raw_user_meta_data->>'role' IN ('sunshine_admin', 'ss_team');

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "staff"}'::jsonb
WHERE raw_user_meta_data->>'role' IN ('manager', 'receptionist', 'reception', 'cleaner');

-- 2) staff_auth roles
ALTER TABLE public.staff_auth ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE public.staff_auth SET role = 'ss_system' WHERE role IN ('ss_team', 'sunshine_admin');
UPDATE public.staff_auth SET role = 'staff' WHERE role IN ('manager', 'receptionist', 'reception', 'cleaner');

-- 3) staff table (calendar roster)
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.staff SET auth_role = 'ss_system' WHERE auth_role IN ('ss_team', 'sunshine_admin');
UPDATE public.staff SET auth_role = 'staff' WHERE auth_role IN ('manager', 'receptionist', 'reception', 'cleaner');
UPDATE public.staff SET role = 'staff' WHERE role IN ('manager', 'receptionist', 'reception', 'cleaner');

-- 4) staff_permissions (owner configures staff access in Settings)
CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID,
  can_see_clients BOOLEAN DEFAULT true,
  can_see_other_bookings BOOLEAN DEFAULT false,
  can_edit_bookings BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (shop_id, employee_id)
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_permissions_select ON public.staff_permissions;
CREATE POLICY staff_permissions_select ON public.staff_permissions FOR SELECT USING (true);
DROP POLICY IF EXISTS staff_permissions_insert ON public.staff_permissions;
CREATE POLICY staff_permissions_insert ON public.staff_permissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS staff_permissions_update ON public.staff_permissions;
CREATE POLICY staff_permissions_update ON public.staff_permissions FOR UPDATE USING (true);
