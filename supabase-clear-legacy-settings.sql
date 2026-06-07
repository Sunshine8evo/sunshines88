-- Clear legacy shop settings data (run in Supabase SQL Editor).
-- Keeps tenants, staff auth, and bookings intact.

DELETE FROM public.services;
DELETE FROM public.addons;
DELETE FROM public.commissions;
DELETE FROM public.rooms;
DELETE FROM public.business_hours;
DELETE FROM public.intake_form;
DELETE FROM public.settings;
DELETE FROM public.customer_shops;
DELETE FROM public.sunshines_team;
DELETE FROM public.businesses;

-- Optional: reset custom roles (keeps system defaults if re-seeded)
DELETE FROM public.roles WHERE COALESCE(is_system, false) = false;
