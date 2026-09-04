-- Create post_images table for multiple images per post
CREATE TABLE public.post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_post_images_post_id ON public.post_images(post_id);

-- Enable RLS
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view post images (posts are public)
CREATE POLICY "Anyone can view post images" 
  ON public.post_images FOR SELECT USING (true);

-- Users can insert images for their own posts
CREATE POLICY "Users can insert own post images" 
  ON public.post_images FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND p.profile_id = get_current_profile_id()
    ) AND has_active_access()
  );

-- Users can delete images from their own posts
CREATE POLICY "Users can delete own post images" 
  ON public.post_images FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND p.profile_id = get_current_profile_id()
    )
  );