-- Run in Supabase Dashboard → SQL Editor
-- Extends staff table for Employee Management + customer booking visibility

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS show_in_booking BOOLEAN DEFAULT true;

UPDATE public.staff
SET position = COALESCE(NULLIF(position, ''), role, '')
WHERE position IS NULL OR position = '';

UPDATE public.staff SET show_in_booking = true WHERE show_in_booking IS NULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
