-- Staff work schedule, services, pay rates, sort order
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS work_days JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS work_hours JSONB DEFAULT '{"start":"10:00","end":"21:00"}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS pay_rates JSONB DEFAULT '[]'::jsonb;

UPDATE public.staff SET work_days = '[0,1,2,3,4,5,6]'::jsonb WHERE work_days IS NULL;
UPDATE public.staff SET work_hours = '{"start":"10:00","end":"21:00"}'::jsonb WHERE work_hours IS NULL;
UPDATE public.staff SET services = '{}'::jsonb WHERE services IS NULL;
UPDATE public.staff SET pay_rates = '[]'::jsonb WHERE pay_rates IS NULL;
