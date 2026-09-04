-- =====================================================
-- FIX: Remove sensitive fields from public_profiles view
-- Remove trial_ends_at and membership_tier to prevent exposure
-- =====================================================
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
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
  last_seen_at
FROM profiles;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;