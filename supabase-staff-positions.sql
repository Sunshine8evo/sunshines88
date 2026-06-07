-- Staff organizational position (Manager | Receptionist | Staff) + custom label + avatar
-- Run in Supabase SQL Editor after supabase-staff-columns-fix.sql

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS staff_position TEXT DEFAULT 'staff';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS position_name TEXT DEFAULT '';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

UPDATE public.staff SET staff_position = 'staff' WHERE staff_position IS NULL OR staff_position = '';
UPDATE public.staff SET position_name = '' WHERE position_name IS NULL;

-- Legacy auth_role manager/reception → staff + matching staff_position
UPDATE public.staff
SET auth_role = 'staff', staff_position = 'manager'
WHERE LOWER(COALESCE(auth_role, '')) = 'manager'
  AND (staff_position IS NULL OR staff_position = '' OR staff_position = 'staff');

UPDATE public.staff
SET auth_role = 'staff', staff_position = 'receptionist'
WHERE LOWER(COALESCE(auth_role, '')) IN ('reception', 'receptionist')
  AND (staff_position IS NULL OR staff_position = '' OR staff_position = 'staff');

COMMENT ON COLUMN public.staff.staff_position IS 'Organizational tier for auth_role=staff: manager | receptionist | staff';
COMMENT ON COLUMN public.staff.position_name IS 'Custom shop position label, e.g. Beauty';
COMMENT ON COLUMN public.staff.position IS 'Job title / service role, e.g. Massage Therapist';
COMMENT ON COLUMN public.staff.avatar_url IS 'Photo URL/data URL or system:preset-id for default avatar';
