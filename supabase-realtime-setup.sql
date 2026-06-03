-- Realtime: verify + enable tables (skips tables that do not exist yet)
-- Run in Supabase SQL Editor — copy ALL lines, Run once

-- ========== 0) Optional: create commissions if missing (fixes 42P01 error) ==========
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  staff_target TEXT NOT NULL DEFAULT 'all',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commissions_select ON public.commissions;
CREATE POLICY commissions_select ON public.commissions FOR SELECT USING (true);
DROP POLICY IF EXISTS commissions_insert ON public.commissions;
CREATE POLICY commissions_insert ON public.commissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS commissions_update ON public.commissions;
CREATE POLICY commissions_update ON public.commissions FOR UPDATE USING (true);
DROP POLICY IF EXISTS commissions_delete ON public.commissions;
CREATE POLICY commissions_delete ON public.commissions FOR DELETE USING (true);

-- ========== 1) Which tables exist in your database? ==========
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========== 2) Realtime BEFORE ==========
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ========== 3) Add each table ONLY if it exists (no error if missing) ==========
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'bookings', 'staff', 'addons', 'services', 'rooms',
    'commissions', 'settings', 'sunshines_team',
    'business_hours', 'intake_form', 'roles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- ========== 4) Realtime AFTER (must include addons, bookings, staff at minimum) ==========
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
