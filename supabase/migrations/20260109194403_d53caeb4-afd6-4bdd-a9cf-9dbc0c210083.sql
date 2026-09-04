-- Create storage bucket for forum images
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload forum images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum-images' 
  AND auth.role() = 'authenticated'
);

-- Allow everyone to view forum images
CREATE POLICY "Forum images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own forum images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'forum-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add image_url column to forum_posts
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_url column to forum_comments
ALTER TABLE public.forum_comments 
ADD COLUMN IF NOT EXISTS image_url text;