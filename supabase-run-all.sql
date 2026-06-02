-- Combined migrations for Sunshines88
-- staff columns + settings table + notification defaults

-- === Staff upgrade (employee.html + booking visibility) ===
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

-- === Settings / Notifications ===
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS settings_select ON public.settings;
CREATE POLICY settings_select ON public.settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS settings_insert ON public.settings;
CREATE POLICY settings_insert ON public.settings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS settings_update ON public.settings;
CREATE POLICY settings_update ON public.settings
  FOR UPDATE USING (true);

INSERT INTO public.settings (category, data)
SELECT
  'notifications',
  '{
    "template_booking_confirmation": "Hi {name}, thank you for booking at {shop}! Your {service} appointment is on {date} at {time}. We look forward to seeing you.",
    "template_confirm_request": "Hi {name}, please confirm your appointment at {shop} on {date} at {time} for {service}. Reply YES to confirm or NO to cancel.",
    "sms_booking_confirmation": true,
    "email_booking_confirmation": true,
    "reminder_duration_hours": 24,
    "confirm_flow_enabled": true,
    "confirm_timeout_hours": 24,
    "auto_booking_notification": true
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings WHERE category = 'notifications'
);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
