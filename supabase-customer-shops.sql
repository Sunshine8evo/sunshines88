-- Customer shops list (Settings → Customer Shop Information)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.customer_shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT NOT NULL,
  shop_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_shops_select ON public.customer_shops;
CREATE POLICY customer_shops_select ON public.customer_shops FOR SELECT USING (true);
DROP POLICY IF EXISTS customer_shops_insert ON public.customer_shops;
CREATE POLICY customer_shops_insert ON public.customer_shops FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS customer_shops_update ON public.customer_shops;
CREATE POLICY customer_shops_update ON public.customer_shops FOR UPDATE USING (true);
DROP POLICY IF EXISTS customer_shops_delete ON public.customer_shops;
CREATE POLICY customer_shops_delete ON public.customer_shops FOR DELETE USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_shops;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
