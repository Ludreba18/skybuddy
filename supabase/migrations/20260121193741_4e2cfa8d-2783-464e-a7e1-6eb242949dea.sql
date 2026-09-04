-- Add GDPR consent fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cookie_preferences JSONB DEFAULT '{"necessary": true, "functional": false, "analytics": false}'::jsonb;