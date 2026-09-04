-- Drop the existing view with security_invoker
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate view WITHOUT security_invoker so it bypasses RLS on profiles table
-- This allows all users to see all pilot profiles (excluding sensitive fields like email)
CREATE VIEW public.public_profiles AS
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
FROM profiles;

-- Grant read access to all users (authenticated and anonymous)
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;