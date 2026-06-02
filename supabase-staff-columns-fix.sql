-- Run once in Supabase SQL Editor (fixes employee save errors)
-- Project: bjzhmdpuzfbpkvohntjx

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS show_in_booking BOOLEAN DEFAULT true;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS auth_role TEXT DEFAULT 'staff';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS work_days JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS work_hours JSONB DEFAULT '{"start":"10:00","end":"21:00"}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS pay_rates JSONB DEFAULT '[]'::jsonb;

UPDATE public.staff SET show_in_booking = true WHERE show_in_booking IS NULL;
UPDATE public.staff SET auth_role = 'staff' WHERE auth_role IS NULL;
UPDATE public.staff SET work_days = '[0,1,2,3,4,5,6]'::jsonb WHERE work_days IS NULL;
UPDATE public.staff SET work_hours = '{"start":"10:00","end":"21:00"}'::jsonb WHERE work_hours IS NULL;
UPDATE public.staff SET services = '{}'::jsonb WHERE services IS NULL;
UPDATE public.staff SET pay_rates = '[]'::jsonb WHERE pay_rates IS NULL;
