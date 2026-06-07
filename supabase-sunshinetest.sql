-- Sunshine Test tenant + owner login (run in Supabase SQL Editor)

INSERT INTO public.tenants (slug, shop_name, owner_name, owner_email, plan, status)
VALUES (
  'sunshinetest',
  'Sunshine Test',
  'Sunshines1',
  'sunshines1@sunshines88.com',
  'trial',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  owner_name = EXCLUDED.owner_name,
  owner_email = EXCLUDED.owner_email,
  status = 'active',
  updated_at = now();

INSERT INTO public.staff_auth (username, password, email, role, name, display_name)
VALUES (
  'sunshines1',
  'Bowvy',
  'sunshines1@sunshines88.com',
  'owner',
  'Sunshine Test Owner',
  'Sunshines1'
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  updated_at = now();
