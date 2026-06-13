-- Commission method support: percent (% of revenue) vs flat ($ per session) + apply_to scope
-- Run in Supabase SQL Editor.

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS method   TEXT    NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS rate     NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS apply_to TEXT    NOT NULL DEFAULT 'all';

-- method:   'percent' = % of service revenue per session | 'flat' = fixed $ per session
-- rate:     used when method = 'percent' (e.g. 40 = 40%)
-- price:    (existing column) used when method = 'flat' (e.g. 35 = $35/session)
-- apply_to: 'all' | 'massage' | 'facial' | 'couple'
