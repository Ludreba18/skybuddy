-- Remove SECURITY DEFINER from the view by recreating it with explicit SECURITY INVOKER

DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  nickname,
  avatar_url,
  location,
  home_airport_icao,
  home_airport_name,
  flight_hours,
  bio,
  cover_image_url,
  created_at,
  updated_at,
  last_seen_at,
  membership_tier
FROM public.profiles;

-- Re-grant SELECT permissions
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;