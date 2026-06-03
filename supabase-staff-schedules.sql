-- Per-day staff on/off (Employees → Staff Queue date toggle)
-- Run once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'on' CHECK (status IN ('on', 'off')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, schedule_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON public.staff_schedules (schedule_date);

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_schedules_all ON public.staff_schedules;
CREATE POLICY staff_schedules_all ON public.staff_schedules FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_schedules;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
