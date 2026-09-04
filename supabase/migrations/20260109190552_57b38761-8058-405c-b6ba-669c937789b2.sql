-- Add latitude and longitude columns to events table for location filtering
ALTER TABLE public.events ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE public.events ADD COLUMN longitude DOUBLE PRECISION;

-- Create index for spatial queries
CREATE INDEX idx_events_location ON public.events (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;