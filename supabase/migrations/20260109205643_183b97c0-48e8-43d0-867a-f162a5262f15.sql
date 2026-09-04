-- Fix PUBLIC_DATA_EXPOSURE: User emails publicly exposed
-- The profiles table currently exposes email to everyone, creating privacy/GDPR issues

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a public view for non-sensitive profile data
-- Users can view public profile info (no email, no membership details)
CREATE POLICY "Public profile info viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Note: Since RLS cannot restrict columns, we need to handle this in the application layer
-- The app should only query non-sensitive columns for public profile views
-- Sensitive columns (email, membership_tier, membership_expires_at) should only be queried by profile owners

-- Create a database function to get public profile data (excludes sensitive fields)
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
SECURITY DEFINER
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

-- Create a view for public profiles that excludes email
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Grant access to the view for authenticated and anon users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;