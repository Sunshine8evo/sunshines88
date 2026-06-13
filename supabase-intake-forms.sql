-- Post-Booking Intake Form
-- Run in Supabase Dashboard → SQL Editor
-- Project: bjzhmdpuzfbpkvohntjx

-- 1) Add a unique intake_token to bookings.
--    A DB-level default auto-generates a token for every new booking, so the
--    existing booking flow needs no code changes. Existing rows are backfilled.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS intake_token text;

ALTER TABLE public.bookings
  ALTER COLUMN intake_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

UPDATE public.bookings
  SET intake_token = replace(gen_random_uuid()::text, '-', '')
  WHERE intake_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_intake_token_key
  ON public.bookings (intake_token);

-- 2) Intake form submissions.
CREATE TABLE IF NOT EXISTS public.intake_forms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  token             text UNIQUE NOT NULL,
  submitted_at      timestamptz,

  -- emergency contact
  emergency_name    text,
  emergency_phone   text,

  -- medical
  conditions        text[]  DEFAULT '{}',
  other_condition   text,
  is_pregnant       boolean,
  pregnant_weeks    int,
  had_surgery       boolean,
  surgery_type      text,
  surgery_date      text,
  surgery_how_long  text,
  surgery_area      text,
  surgery_notes     text,
  medications       text,
  allergies         text,
  discomfort_areas  text[]  DEFAULT '{}',
  therapist_notes   text,

  -- consent
  consent_agreed    boolean NOT NULL DEFAULT false,
  policy_agreed     boolean NOT NULL DEFAULT false,
  signature_data    text,             -- base64 canvas PNG

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 3) RLS: reads are open (so staff dashboards can show intake status), but
--    writes happen only through the service-role API route (which bypasses RLS).
--    No INSERT/UPDATE policy = the public anon key cannot tamper with submissions.
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intake_forms_select ON public.intake_forms;
CREATE POLICY intake_forms_select ON public.intake_forms
  FOR SELECT USING (true);
