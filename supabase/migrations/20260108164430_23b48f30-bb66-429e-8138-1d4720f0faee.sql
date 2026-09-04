-- Performance-Optimierungen für 1000+ gleichzeitige Nutzer

-- 1. Helper-Funktion für schnellere RLS-Policies
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Helper-Funktion für Premium-Check
CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND membership_tier = 'premium'
  );
$$;

-- 3. Kritische Datenbank-Indizes

-- Profile-Lookups (am häufigsten verwendet)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON public.profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_home_airport ON public.profiles(home_airport_icao);

-- Event-Abfragen
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_public ON public.events(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_profile ON public.event_participants(profile_id);

-- Forum-Performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON public.forum_comments(post_id);

-- Chat-Performance (kritisch bei vielen Nutzern)
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_profile ON public.conversation_participants(profile_id);

-- Airport-Suche
CREATE INDEX IF NOT EXISTS idx_airports_icao ON public.airports(icao_code);
CREATE INDEX IF NOT EXISTS idx_airports_country ON public.airports(country_code);