-- Fix the security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

-- Create a simple view without SECURITY DEFINER (inherits caller's permissions)
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

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Also update the function to be SECURITY INVOKER instead
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  nickname text,
  avatar_url text,
  location text,
  home_airport_icao text,
  home_airport_name text,
  flight_hours integer,
  bio text,
  cover_image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_seen_at timestamptz,
  membership_tier membership_tier
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.nickname,
    p.avatar_url,
    p.location,
    p.home_airport_icao,
    p.home_airport_name,
    p.flight_hours,
    p.bio,
    p.cover_image_url,
    p.created_at,
    p.updated_at,
    p.last_seen_at,
    p.membership_tier
  FROM profiles p
  WHERE p.id = profile_id;
$$;