-- Add last_seen_at column to profiles for tracking online status
ALTER TABLE public.profiles 
ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create an index for faster queries on last_seen_at
CREATE INDEX idx_profiles_last_seen_at ON public.profiles(last_seen_at DESC);