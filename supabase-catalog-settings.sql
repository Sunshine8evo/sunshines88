-- Services catalog settings: commissions table + addon service link + optional sort columns

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

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

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.commissions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
