-- Run in Supabase Dashboard → SQL Editor
-- Staff login + password reset support

CREATE TABLE IF NOT EXISTS public.staff_auth (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff',
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.staff_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

INSERT INTO public.staff_auth (username, password, email, role, name, display_name) VALUES
  ('owner', 'owner123', 'owner@sunshines88.com', 'owner', 'Owner', 'Owner Admin'),
  ('sunshines', 'Bowvy', 'sunshines@sunshines88.com', 'owner', 'Sunshine', 'Sunshine Team'),
  ('manager', 'mgr123', 'manager@sunshines88.com', 'manager', 'Manager', 'Manager'),
  ('reception', 'rec123', 'reception@sunshines88.com', 'reception', 'Reception', 'Reception'),
  ('staff', 'staff123', 'staff@sunshines88.com', 'staff', 'Pam', 'Pam (Staff)'),
  ('pam', 'pam123', 'pam@sunshines88.com', 'staff', 'Pam', 'Pam'),
  ('noon', 'noon123', 'noon@sunshines88.com', 'staff', 'Noon', 'Noon'),
  ('min', 'min123', 'min@sunshines88.com', 'staff', 'Min', 'Min'),
  ('jane', 'jane123', 'jane@sunshines88.com', 'staff', 'Jane', 'Jane')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  updated_at = now();

-- Update sunshines email to your real inbox before using forgot password:
-- UPDATE public.staff_auth SET email = 'your-real-email@example.com' WHERE username = 'sunshines';
