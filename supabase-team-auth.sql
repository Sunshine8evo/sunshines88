-- Staff login fields + Sunshines Team accounts + SS Team role

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS auth_role TEXT DEFAULT 'staff';

CREATE TABLE IF NOT EXISTS public.sunshines_team (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sunshines_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sunshines_team_select ON public.sunshines_team;
CREATE POLICY sunshines_team_select ON public.sunshines_team FOR SELECT USING (true);
DROP POLICY IF EXISTS sunshines_team_insert ON public.sunshines_team;
CREATE POLICY sunshines_team_insert ON public.sunshines_team FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS sunshines_team_update ON public.sunshines_team;
CREATE POLICY sunshines_team_update ON public.sunshines_team FOR UPDATE USING (true);
DROP POLICY IF EXISTS sunshines_team_delete ON public.sunshines_team;
CREATE POLICY sunshines_team_delete ON public.sunshines_team FOR DELETE USING (true);

DROP POLICY IF EXISTS staff_auth_select ON public.staff_auth;
CREATE POLICY staff_auth_select ON public.staff_auth FOR SELECT USING (true);
DROP POLICY IF EXISTS staff_auth_insert ON public.staff_auth;
CREATE POLICY staff_auth_insert ON public.staff_auth FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS staff_auth_update ON public.staff_auth;
CREATE POLICY staff_auth_update ON public.staff_auth FOR UPDATE USING (true);
DROP POLICY IF EXISTS staff_auth_delete ON public.staff_auth;
CREATE POLICY staff_auth_delete ON public.staff_auth FOR DELETE USING (true);

INSERT INTO public.roles (role_key, label, icon, color, text_color, menu_permissions, is_system, sort_order)
VALUES (
  'ss_team',
  'SS Team',
  'ti-stars',
  '#fff0f6',
  '#9d174d',
  '{"calendar":true,"display":true,"employees":true,"clients":true,"settings":true,"payroll":true,"sales":true}'::jsonb,
  true,
  0
)
ON CONFLICT (role_key) DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  text_color = EXCLUDED.text_color,
  menu_permissions = EXCLUDED.menu_permissions,
  is_system = EXCLUDED.is_system,
  sort_order = EXCLUDED.sort_order;

UPDATE public.staff_auth SET role = 'ss_team', updated_at = now()
WHERE lower(username) LIKE 'sunshines%';

INSERT INTO public.staff_auth (username, password, email, role, name, display_name) VALUES
  ('sunshines', 'Bowvy', 'sunshines@sunshines88.com', 'ss_team', 'Sunshines', 'Sunshines')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'ss_team',
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  updated_at = now();

INSERT INTO public.sunshines_team (username, password, sort_order) VALUES
  ('Sunshines', 'Bowvy', 1)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  updated_at = now();

INSERT INTO public.staff (name, full_name, position, role, color, text_color, status, show_in_booking, sort_order, username, password, auth_role)
SELECT 'Mumu', 'Mumu', 'Manager', 'Manager', '#eaf3fc', '#0c447c', 'on', true, 6, 'Mumu', '2810', 'manager'
WHERE NOT EXISTS (SELECT 1 FROM public.staff WHERE lower(name) = 'mumu');

INSERT INTO public.staff_auth (username, password, email, role, name, display_name) VALUES
  ('mumu', '2810', 'mumu@sunshines88.com', 'manager', 'Mumu', 'Mumu')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  updated_at = now();

UPDATE public.staff SET username = 'Mumu', password = '2810', auth_role = 'manager'
WHERE lower(name) = 'mumu' AND (username IS NULL OR username = '');

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sunshines_team;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
