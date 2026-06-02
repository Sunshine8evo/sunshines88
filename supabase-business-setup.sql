-- Run in Supabase Dashboard → SQL Editor
-- Business profile for dashboard header

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT 'Sunshine Spa',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS businesses_select ON public.businesses;
CREATE POLICY businesses_select ON public.businesses
  FOR SELECT USING (true);

INSERT INTO public.businesses (business_name)
SELECT 'Sunshine Spa'
WHERE NOT EXISTS (SELECT 1 FROM public.businesses LIMIT 1);
