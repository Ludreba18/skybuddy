-- Create enum types for SkyBuddy
CREATE TYPE public.license_type AS ENUM ('UL', 'PPL_A', 'LAPL', 'CPL', 'FI', 'IR', 'ATPL');
CREATE TYPE public.membership_tier AS ENUM ('free', 'premium');
CREATE TYPE public.event_type AS ENUM ('flyout', 'meetup', 'stammtisch');

-- Create profiles table for pilot information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  nickname TEXT,
  avatar_url TEXT,
  location TEXT,
  home_airport_icao TEXT,
  home_airport_name TEXT,
  flight_hours INTEGER DEFAULT 0,
  bio TEXT,
  membership_tier membership_tier NOT NULL DEFAULT 'free',
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pilot licenses table (many-to-many)
CREATE TABLE public.pilot_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  license_type license_type NOT NULL,
  obtained_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, license_type)
);

-- Create aircraft types table
CREATE TABLE public.pilot_aircraft (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  aircraft_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, aircraft_type)
);

-- Create interests table
CREATE TABLE public.pilot_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, interest)
);

-- Create airports database
CREATE TABLE public.airports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icao_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'flyout',
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  airport_icao TEXT,
  airport_name TEXT,
  max_participants INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'attending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

-- Create forum categories
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum posts
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum comments
CREATE TABLE public.forum_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post likes
CREATE TABLE public.forum_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, profile_id)
);

-- Create chat conversations
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group BOOLEAN DEFAULT false,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation participants
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, profile_id)
);

-- Create messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pilot details policies (licenses, aircraft, interests)
CREATE POLICY "Pilot licenses viewable by everyone" ON public.pilot_licenses FOR SELECT USING (true);
CREATE POLICY "Users can manage own licenses" ON public.pilot_licenses FOR ALL USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Pilot aircraft viewable by everyone" ON public.pilot_aircraft FOR SELECT USING (true);
CREATE POLICY "Users can manage own aircraft" ON public.pilot_aircraft FOR ALL USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Pilot interests viewable by everyone" ON public.pilot_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage own interests" ON public.pilot_interests FOR ALL USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Airports policy (public read)
CREATE POLICY "Airports are viewable by everyone" ON public.airports FOR SELECT USING (true);

-- Events policies
CREATE POLICY "Public events viewable by everyone" ON public.events FOR SELECT USING (is_public = true);
CREATE POLICY "Premium users can create events" ON public.events FOR INSERT WITH CHECK (
  organizer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'premium')
);
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE USING (
  organizer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Organizers can delete own events" ON public.events FOR DELETE USING (
  organizer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Event participants policies
CREATE POLICY "Event participants viewable by everyone" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Premium users can join events" ON public.event_participants FOR INSERT WITH CHECK (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'premium')
);
CREATE POLICY "Users can update own participation" ON public.event_participants FOR UPDATE USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can leave events" ON public.event_participants FOR DELETE USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Forum policies
CREATE POLICY "Forum categories viewable by everyone" ON public.forum_categories FOR SELECT USING (true);

CREATE POLICY "Forum posts viewable by everyone" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Premium users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (
  author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'premium')
);
CREATE POLICY "Authors can update own posts" ON public.forum_posts FOR UPDATE USING (
  author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Authors can delete own posts" ON public.forum_posts FOR DELETE USING (
  author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Forum comments viewable by everyone" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "Premium users can create comments" ON public.forum_comments FOR INSERT WITH CHECK (
  author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'premium')
);
CREATE POLICY "Authors can update own comments" ON public.forum_comments FOR UPDATE USING (
  author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Authors can delete own comments" ON public.forum_comments FOR DELETE USING (
  author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Post likes viewable by everyone" ON public.forum_post_likes FOR SELECT USING (true);
CREATE POLICY "Premium users can like posts" ON public.forum_post_likes FOR INSERT WITH CHECK (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'premium')
);
CREATE POLICY "Users can remove own likes" ON public.forum_post_likes FOR DELETE USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Chat policies (premium only)
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT USING (
  id IN (SELECT conversation_id FROM public.conversation_participants WHERE profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "Premium users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'premium')
);

CREATE POLICY "Users can view own participations" ON public.conversation_participants FOR SELECT USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "Premium users can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'premium')
);

CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
);

-- Create function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_comments_updated_at BEFORE UPDATE ON public.forum_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default forum categories
INSERT INTO public.forum_categories (name, description, icon, sort_order) VALUES
  ('Ausbildung', 'Fragen und Tipps zur Pilotenausbildung', 'GraduationCap', 1),
  ('Technik', 'Diskussionen über Flugzeuge und Avionik', 'Wrench', 2),
  ('Reisen', 'Flugreisen, Routen und Tipps', 'Compass', 3),
  ('Safety', 'Sicherheitsthemen und Erfahrungen', 'Shield', 4),
  ('Flugberichte', 'Teile deine Flugerfahrungen', 'BookOpen', 5),
  ('Allgemein', 'Alles andere rund ums Fliegen', 'MessageCircle', 6);

-- Insert sample airports
INSERT INTO public.airports (icao_code, name, country, country_code) VALUES
  ('EDDF', 'Frankfurt Airport', 'Deutschland', 'DE'),
  ('EDDM', 'München Airport', 'Deutschland', 'DE'),
  ('EDDH', 'Hamburg Airport', 'Deutschland', 'DE'),
  ('EDDB', 'Berlin Brandenburg', 'Deutschland', 'DE'),
  ('EDDK', 'Köln/Bonn Airport', 'Deutschland', 'DE'),
  ('EDDS', 'Stuttgart Airport', 'Deutschland', 'DE'),
  ('EDDL', 'Düsseldorf Airport', 'Deutschland', 'DE'),
  ('EDDN', 'Nürnberg Airport', 'Deutschland', 'DE'),
  ('EDNY', 'Friedrichshafen Airport', 'Deutschland', 'DE'),
  ('EDFD', 'Bad Neustadt/Saale', 'Deutschland', 'DE'),
  ('EDXW', 'Westerland/Sylt', 'Deutschland', 'DE'),
  ('LOWW', 'Wien Schwechat', 'Österreich', 'AT'),
  ('LSZH', 'Zürich Airport', 'Schweiz', 'CH'),
  ('EHAM', 'Amsterdam Schiphol', 'Niederlande', 'NL'),
  ('LFPG', 'Paris Charles de Gaulle', 'Frankreich', 'FR'),
  ('EGLL', 'London Heathrow', 'Vereinigtes Königreich', 'GB');

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;