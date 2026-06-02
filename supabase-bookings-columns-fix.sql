-- Run once in Supabase SQL Editor (fixes booking save errors)
-- Project: bjzhmdpuzfbpkvohntjx

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_date DATE NOT NULL,
  h INTEGER NOT NULL DEFAULT 10,
  m INTEGER NOT NULL DEFAULT 0,
  dur INTEGER NOT NULL DEFAULT 60,
  fname TEXT DEFAULT '',
  lname TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  name TEXT DEFAULT 'Guest',
  svc TEXT DEFAULT '',
  staff_col INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  req BOOLEAN DEFAULT false,
  addon TEXT DEFAULT '',
  staff TEXT DEFAULT '',
  staff2 TEXT DEFAULT '',
  room TEXT DEFAULT '',
  room_type TEXT DEFAULT '',
  intime TEXT DEFAULT '',
  outtime TEXT DEFAULT '',
  week_day INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  client_id INTEGER DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tip NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS h INTEGER DEFAULT 10;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS m INTEGER DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dur INTEGER DEFAULT 60;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fname TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS lname TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Guest';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS svc TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS staff_col INTEGER DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS req BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS addon TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS staff TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS staff2 TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS intime TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS outtime TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS week_day INTEGER DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_id INTEGER DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tip NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Legacy column name (app reads staff_col ?? col)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS col INTEGER;

UPDATE public.bookings SET staff_col = COALESCE(staff_col, col, 1) WHERE staff_col IS NULL;
UPDATE public.bookings SET status = COALESCE(NULLIF(status, ''), 'pending') WHERE status IS NULL;
UPDATE public.bookings SET client_id = COALESCE(client_id, 0) WHERE client_id IS NULL;
UPDATE public.bookings SET req = COALESCE(req, false) WHERE req IS NULL;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_select ON public.bookings;
CREATE POLICY bookings_select ON public.bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS bookings_insert ON public.bookings;
CREATE POLICY bookings_insert ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS bookings_update ON public.bookings;
CREATE POLICY bookings_update ON public.bookings FOR UPDATE USING (true);
DROP POLICY IF EXISTS bookings_delete ON public.bookings;
CREATE POLICY bookings_delete ON public.bookings FOR DELETE USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
