-- SS Team + Staff login (self-contained — run once in SQL Editor)
-- Creates missing tables first, then seeds accounts

-- ========== 1) staff (calendar roster) ==========
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  full_name TEXT DEFAULT '',
  role TEXT DEFAULT '',
  position TEXT DEFAULT '',
  color TEXT DEFAULT '#fdf0f3',
  text_color TEXT DEFAULT '#8a1a30',
  status TEXT DEFAULT 'on',
  show_in_booking BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  username TEXT,
  password TEXT,
  auth_role TEXT DEFAULT 'staff',
  work_days JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
  work_hours JSONB DEFAULT '{"start":"10:00","end":"21:00"}'::jsonb,
  services JSONB DEFAULT '{}'::jsonb,
  pay_rates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_select ON public.staff;
CREATE POLICY staff_select ON public.staff FOR SELECT USING (true);
DROP POLICY IF EXISTS staff_insert ON public.staff;
CREATE POLICY staff_insert ON public.staff FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS staff_update ON public.staff;
CREATE POLICY staff_update ON public.staff FOR UPDATE USING (true);
DROP POLICY IF EXISTS staff_delete ON public.staff;
CREATE POLICY staff_delete ON public.staff FOR DELETE USING (true);

-- ========== 2) staff_auth (login for index.html /api/auth) ==========
CREATE TABLE IF NOT EXISTS public.staff_auth (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff',
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.staff_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_auth_select ON public.staff_auth;
CREATE POLICY staff_auth_select ON public.staff_auth FOR SELECT USING (true);
DROP POLICY IF EXISTS staff_auth_insert ON public.staff_auth;
CREATE POLICY staff_auth_insert ON public.staff_auth FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS staff_auth_update ON public.staff_auth;
CREATE POLICY staff_auth_update ON public.staff_auth FOR UPDATE USING (true);
DROP POLICY IF EXISTS staff_auth_delete ON public.staff_auth;
CREATE POLICY staff_auth_delete ON public.staff_auth FOR DELETE USING (true);

-- ========== 3) roles (Settings → Roles) ==========
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT DEFAULT 'ti-user',
  color TEXT DEFAULT '#f4f4f4',
  text_color TEXT DEFAULT '#555555',
  menu_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select ON public.roles FOR SELECT USING (true);
DROP POLICY IF EXISTS roles_insert ON public.roles;
CREATE POLICY roles_insert ON public.roles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS roles_update ON public.roles;
CREATE POLICY roles_update ON public.roles FOR UPDATE USING (true);
DROP POLICY IF EXISTS roles_delete ON public.roles;
CREATE POLICY roles_delete ON public.roles FOR DELETE USING (true);

INSERT INTO public.roles (role_key, label, icon, color, text_color, menu_permissions, is_system, sort_order)
SELECT * FROM (VALUES
  ('owner', 'Owner', 'ti-crown', '#fdf0f3', '#8a1a30',
    '{"calendar":true,"display":true,"employees":true,"clients":true,"settings":true,"payroll":true,"sales":true}'::jsonb, true, 1),
  ('manager', 'Manager', 'ti-user-check', '#eaf3fc', '#0c447c',
    '{"calendar":true,"display":true,"employees":true,"clients":true,"settings":true,"payroll":true,"sales":true}'::jsonb, true, 2),
  ('reception', 'Reception', 'ti-headset', '#fdf6e7', '#7d5a00',
    '{"calendar":true,"display":true,"employees":false,"clients":true,"settings":false,"payroll":false,"sales":true}'::jsonb, true, 3),
  ('staff', 'Staff', 'ti-user', '#f4f4f4', '#555555',
    '{"calendar":true,"display":true,"employees":false,"clients":false,"settings":false,"payroll":true,"sales":false}'::jsonb, true, 4)
) AS v(role_key, label, icon, color, text_color, menu_permissions, is_system, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.roles LIMIT 1);

-- ========== 4) sunshines_team (SS Team accounts) ==========
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

-- ========== 5) Staff columns (table may already exist — add missing columns) ==========
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS role TEXT DEFAULT '';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#fdf0f3';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#8a1a30';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'on';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS show_in_booking BOOLEAN DEFAULT true;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS auth_role TEXT DEFAULT 'staff';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS work_days JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS work_hours JSONB DEFAULT '{"start":"10:00","end":"21:00"}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS pay_rates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ========== 6) Default login accounts ==========
INSERT INTO public.staff_auth (username, password, email, role, name, display_name) VALUES
  ('owner', 'owner123', 'owner@sunshines88.com', 'owner', 'Owner', 'Owner Admin'),
  ('sunshines', 'Bowvy', 'sunshines@sunshines88.com', 'ss_team', 'Sunshines', 'Sunshines'),
  ('manager', 'mgr123', 'manager@sunshines88.com', 'manager', 'Manager', 'Manager'),
  ('reception', 'rec123', 'reception@sunshines88.com', 'reception', 'Reception', 'Reception'),
  ('staff', 'staff123', 'staff@sunshines88.com', 'staff', 'Staff', 'Staff'),
  ('pam', 'pam123', 'pam@sunshines88.com', 'staff', 'Pam', 'Pam'),
  ('noon', 'noon123', 'noon@sunshines88.com', 'staff', 'Noon', 'Noon'),
  ('min', 'min123', 'min@sunshines88.com', 'staff', 'Min', 'Min'),
  ('jane', 'jane123', 'jane@sunshines88.com', 'staff', 'Jane', 'Jane')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  updated_at = now();

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

-- ========== 7) Realtime (optional) ==========
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sunshines_team;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_auth;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== 8) Verify ==========
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('staff','staff_auth','roles','sunshines_team') ORDER BY 1;
