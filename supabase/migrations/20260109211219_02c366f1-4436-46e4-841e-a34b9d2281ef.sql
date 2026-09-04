-- Fix SECURITY DEFINER view issue and restrict profiles SELECT to own data

-- 1. Drop and recreate the public_profiles view without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

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
FROM public.profiles;

-- 2. Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- 3. Drop the permissive policy that exposes all data including email
DROP POLICY IF EXISTS "Public profile info viewable by everyone" ON public.profiles;

-- 4. Create a new policy that only allows users to SELECT their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);