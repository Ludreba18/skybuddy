-- Function to increment comments count on forum posts
CREATE OR REPLACE FUNCTION public.increment_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.forum_posts 
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment likes count on forum posts
CREATE OR REPLACE FUNCTION public.increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.forum_posts 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to decrement likes count on forum posts
CREATE OR REPLACE FUNCTION public.decrement_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.forum_posts 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update likes count when a like is added
CREATE OR REPLACE FUNCTION public.handle_forum_like_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_posts 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update likes count when a like is removed
CREATE OR REPLACE FUNCTION public.handle_forum_like_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_posts 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update comments count when a comment is added
CREATE OR REPLACE FUNCTION public.handle_forum_comment_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_posts 
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update comments count when a comment is removed
CREATE OR REPLACE FUNCTION public.handle_forum_comment_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_posts 
  SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS on_forum_like_insert ON public.forum_post_likes;
CREATE TRIGGER on_forum_like_insert
  AFTER INSERT ON public.forum_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_forum_like_insert();

DROP TRIGGER IF EXISTS on_forum_like_delete ON public.forum_post_likes;
CREATE TRIGGER on_forum_like_delete
  AFTER DELETE ON public.forum_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_forum_like_delete();

DROP TRIGGER IF EXISTS on_forum_comment_insert ON public.forum_comments;
CREATE TRIGGER on_forum_comment_insert
  AFTER INSERT ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_forum_comment_insert();

DROP TRIGGER IF EXISTS on_forum_comment_delete ON public.forum_comments;
CREATE TRIGGER on_forum_comment_delete
  AFTER DELETE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_forum_comment_delete();