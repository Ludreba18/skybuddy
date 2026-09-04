-- Create posts table for pilot activity feed
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view posts
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts
  FOR SELECT
  USING (true);

-- Premium users can create posts
CREATE POLICY "Premium users can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (
    profile_id = public.get_current_profile_id() 
    AND public.is_current_user_premium()
  );

-- Users can update own posts
CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  USING (profile_id = public.get_current_profile_id());

-- Users can delete own posts
CREATE POLICY "Users can delete own posts"
  ON public.posts
  FOR DELETE
  USING (profile_id = public.get_current_profile_id());

-- Add index for performance
CREATE INDEX idx_posts_profile ON public.posts(profile_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Storage policies for post images
CREATE POLICY "Post images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Premium users can upload post images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' 
    AND public.is_current_user_premium()
  );

CREATE POLICY "Users can update own post images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own post images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );