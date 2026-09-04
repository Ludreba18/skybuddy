-- =====================================================
-- FIX 1: Restrict notifications INSERT to service role only
-- (Notifications are created by SECURITY DEFINER triggers)
-- =====================================================
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Only triggers can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- FIX 2: Fix event-images storage policies to restrict access
-- Use user folder pattern for ownership enforcement
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event images" ON storage.objects;

-- Only allow uploads to user's own folder (userId/eventId.ext)
CREATE POLICY "Users can upload to own event folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only allow updates to own files
CREATE POLICY "Users can update own event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only allow deletes of own files
CREATE POLICY "Users can delete own event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- FIX 3: Restrict event_participants SELECT to authenticated users only
-- (Prevents anonymous tracking of user attendance)
-- =====================================================
DROP POLICY IF EXISTS "Event participants viewable by everyone" ON public.event_participants;

CREATE POLICY "Event participants viewable by authenticated users"
ON public.event_participants FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FIX 4: Replace SECURITY DEFINER view with SECURITY INVOKER
-- Recreate public_profiles view with SECURITY INVOKER
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
  last_seen_at,
  membership_tier,
  trial_ends_at
FROM profiles;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;