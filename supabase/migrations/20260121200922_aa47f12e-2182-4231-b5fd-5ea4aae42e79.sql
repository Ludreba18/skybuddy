-- Add trial_ends_at column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');

-- Update existing profiles to have 30-day trial from now
UPDATE public.profiles 
SET trial_ends_at = now() + interval '30 days' 
WHERE trial_ends_at IS NULL AND membership_tier = 'free';

-- Update handle_new_user function to set trial_ends_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    first_name, 
    last_name,
    gdpr_consent_at,
    terms_accepted_at,
    trial_ends_at
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    now(),
    now(),
    now() + interval '30 days'
  );
  RETURN new;
END;
$function$;

-- Create new has_active_access function
CREATE OR REPLACE FUNCTION public.has_active_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (
      -- Premium membership active
      (membership_tier = 'premium' AND (membership_expires_at IS NULL OR membership_expires_at > now()))
      OR
      -- Trial still active
      (trial_ends_at IS NOT NULL AND trial_ends_at > now())
    )
  );
$function$;

-- Update RLS policies for posts
DROP POLICY IF EXISTS "Premium users can create posts" ON public.posts;
CREATE POLICY "Users with access can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK ((profile_id = get_current_profile_id()) AND has_active_access());

-- Update RLS policies for events
DROP POLICY IF EXISTS "Premium users can create events" ON public.events;
CREATE POLICY "Users with access can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (organizer_id IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.user_id = auth.uid()
) AND has_active_access());

-- Update RLS policies for event_participants
DROP POLICY IF EXISTS "Premium users can join events" ON public.event_participants;
CREATE POLICY "Users with access can join events" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (profile_id IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.user_id = auth.uid()
) AND has_active_access());

-- Update RLS policies for forum_posts
DROP POLICY IF EXISTS "Premium users can create posts" ON public.forum_posts;
CREATE POLICY "Users with access can create forum posts" 
ON public.forum_posts 
FOR INSERT 
WITH CHECK (author_id IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.user_id = auth.uid()
) AND has_active_access());

-- Update RLS policies for forum_comments
DROP POLICY IF EXISTS "Premium users can create comments" ON public.forum_comments;
CREATE POLICY "Users with access can create comments" 
ON public.forum_comments 
FOR INSERT 
WITH CHECK (author_id IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.user_id = auth.uid()
) AND has_active_access());

-- Update RLS policies for forum_post_likes
DROP POLICY IF EXISTS "Premium users can like posts" ON public.forum_post_likes;
CREATE POLICY "Users with access can like posts" 
ON public.forum_post_likes 
FOR INSERT 
WITH CHECK (profile_id IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.user_id = auth.uid()
) AND has_active_access());

-- Update RLS policies for conversations
DROP POLICY IF EXISTS "Premium users can create conversations" ON public.conversations;
CREATE POLICY "Users with access can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (has_active_access());

-- Update RLS policies for conversation_participants
DROP POLICY IF EXISTS "Premium users can add participants" ON public.conversation_participants;
CREATE POLICY "Users with access can add participants" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (has_active_access());

-- Update public_profiles view to include trial_ends_at
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
  membership_tier,
  trial_ends_at
FROM profiles;