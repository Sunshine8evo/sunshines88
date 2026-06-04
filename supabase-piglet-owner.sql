-- Run in Supabase Dashboard → SQL Editor
-- Owner login: username piglet (login accepts Piglet), password 2810

INSERT INTO public.staff_auth (username, password, email, role, name, display_name) VALUES
  ('piglet', '2810', 'piglet@sunshines88.com', 'owner', 'Piglet', 'Piglet')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  updated_at = now();

-- Optional: link staff roster row if Piglet should appear in employee list
INSERT INTO public.staff (name, full_name, position, role, color, text_color, status, show_in_booking, sort_order, username, password, auth_role)
SELECT 'Piglet', 'Piglet', 'Owner', 'Owner', '#fdf0f3', '#8a1a30', 'on', false, 7, 'Piglet', '2810', 'owner'
WHERE NOT EXISTS (SELECT 1 FROM public.staff WHERE lower(name) = 'piglet');

UPDATE public.staff SET username = 'Piglet', password = '2810', auth_role = 'owner'
WHERE lower(name) = 'piglet' AND (username IS NULL OR username = '' OR auth_role IS DISTINCT FROM 'owner');
