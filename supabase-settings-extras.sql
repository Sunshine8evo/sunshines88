-- Sunshines88 Settings extras: business_hours, intake_form, roles
-- Run after supabase-run-all.sql (or include in same session)

-- === Business Hours ===
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_index INT NOT NULL UNIQUE,
  day_name TEXT NOT NULL,
  is_open BOOLEAN DEFAULT true,
  open_time TEXT DEFAULT '10:00',
  close_time TEXT DEFAULT '21:00',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_hours_select ON public.business_hours;
CREATE POLICY business_hours_select ON public.business_hours FOR SELECT USING (true);
DROP POLICY IF EXISTS business_hours_insert ON public.business_hours;
CREATE POLICY business_hours_insert ON public.business_hours FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS business_hours_update ON public.business_hours;
CREATE POLICY business_hours_update ON public.business_hours FOR UPDATE USING (true);
DROP POLICY IF EXISTS business_hours_delete ON public.business_hours;
CREATE POLICY business_hours_delete ON public.business_hours FOR DELETE USING (true);

INSERT INTO public.business_hours (day_index, day_name, is_open, open_time, close_time)
SELECT * FROM (VALUES
  (0, 'Monday',    true,  '10:00', '21:00'),
  (1, 'Tuesday',   true,  '10:00', '21:00'),
  (2, 'Wednesday', true,  '10:00', '21:00'),
  (3, 'Thursday',  true,  '10:00', '21:00'),
  (4, 'Friday',    true,  '10:00', '22:00'),
  (5, 'Saturday',  true,  '09:00', '22:00'),
  (6, 'Sunday',    false, '10:00', '18:00')
) AS v(day_index, day_name, is_open, open_time, close_time)
WHERE NOT EXISTS (SELECT 1 FROM public.business_hours LIMIT 1);

-- === Intake Form (single config row) ===
CREATE TABLE IF NOT EXISTS public.intake_form (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.intake_form ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intake_form_select ON public.intake_form;
CREATE POLICY intake_form_select ON public.intake_form FOR SELECT USING (true);
DROP POLICY IF EXISTS intake_form_insert ON public.intake_form;
CREATE POLICY intake_form_insert ON public.intake_form FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS intake_form_update ON public.intake_form;
CREATE POLICY intake_form_update ON public.intake_form FOR UPDATE USING (true);

INSERT INTO public.intake_form (standard_fields, custom_fields)
SELECT
  '[
    {"section":"personal","fields":[
      {"id":"first_name","label":"First Name","type":"text","enabled":true,"locked":true},
      {"id":"last_name","label":"Last Name","type":"text","enabled":true,"locked":true},
      {"id":"phone","label":"Phone Number","type":"text","enabled":true,"locked":true},
      {"id":"email","label":"Email","type":"text","enabled":true,"locked":true},
      {"id":"dob","label":"Date of Birth","type":"date","enabled":true,"locked":true}
    ]},
    {"section":"emergency","fields":[
      {"id":"emergency_name","label":"Emergency Contact Name","type":"text","enabled":true,"locked":true},
      {"id":"emergency_phone","label":"Emergency Phone","type":"text","enabled":true,"locked":true}
    ]},
    {"section":"health","fields":[
      {"id":"allergies","label":"Allergies","type":"text","enabled":true,"locked":true},
      {"id":"medical_conditions","label":"Medical Conditions","type":"text","enabled":true,"locked":true},
      {"id":"pregnancy","label":"Pregnancy","type":"yes-no","enabled":true,"locked":true},
      {"id":"recent_surgery","label":"Recent Surgery","type":"yes-no","enabled":true,"locked":true},
      {"id":"surgery_details","label":"Surgery Details","type":"text","enabled":true,"locked":true,"dependsOn":"recent_surgery"}
    ]},
    {"section":"preferences","fields":[
      {"id":"pressure","label":"Pressure Preference","type":"choice","options":["Light","Medium","Firm"],"enabled":true,"locked":true},
      {"id":"areas_concern","label":"Areas of Concern","type":"text","enabled":true,"locked":true}
    ]},
    {"section":"consent","fields":[
      {"id":"cancel_policy","label":"Cancellation Policy","type":"checkbox","enabled":true,"locked":true},
      {"id":"liability_waiver","label":"Liability Waiver","type":"checkbox","enabled":true,"locked":true},
      {"id":"signature","label":"Signature","type":"signature","enabled":true,"locked":true}
    ]}
  ]'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.intake_form LIMIT 1);

-- === Roles ===
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

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.business_hours;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.intake_form;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
