
-- Update get_public_profile to use SECURITY DEFINER so it can bypass RLS
-- and return public profile data for any user (not just the current user)
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(
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
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  last_seen_at timestamp with time zone, 
  membership_tier membership_tier
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
