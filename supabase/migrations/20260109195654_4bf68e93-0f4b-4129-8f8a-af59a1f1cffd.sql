-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'mention', 'reply', 'like'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- link to the post/comment
  is_read BOOLEAN NOT NULL DEFAULT false,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- who triggered the notification
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- System (triggers) can insert notifications - using security definer function
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(profile_id, is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification for mentions
CREATE OR REPLACE FUNCTION public.notify_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mention_match TEXT;
  mentioned_profile RECORD;
  actor_name TEXT;
  post_title TEXT;
BEGIN
  -- Get actor name
  SELECT COALESCE(nickname, first_name, 'Ein Pilot') INTO actor_name 
  FROM profiles WHERE id = NEW.author_id;

  -- For forum posts
  IF TG_TABLE_NAME = 'forum_posts' THEN
    -- Find all @mentions in content
    FOR mention_match IN 
      SELECT DISTINCT (regexp_matches(NEW.content, '@([A-Za-zÄÖÜäöüß]+(?:\s[A-Za-zÄÖÜäöüß]+)?)', 'g'))[1]
    LOOP
      -- Find profile by nickname or name
      SELECT * INTO mentioned_profile FROM profiles 
      WHERE LOWER(nickname) = LOWER(mention_match) 
         OR LOWER(first_name || ' ' || last_name) = LOWER(mention_match)
         OR LOWER(first_name) = LOWER(mention_match)
      LIMIT 1;
      
      IF mentioned_profile.id IS NOT NULL AND mentioned_profile.id != NEW.author_id THEN
        INSERT INTO notifications (profile_id, type, title, message, link, actor_id, post_id)
        VALUES (
          mentioned_profile.id,
          'mention',
          'Erwähnung in einem Beitrag',
          actor_name || ' hat dich in "' || LEFT(NEW.title, 50) || '" erwähnt',
          '/forum?post=' || NEW.id,
          NEW.author_id,
          NEW.id
        );
      END IF;
    END LOOP;
    
  -- For forum comments  
  ELSIF TG_TABLE_NAME = 'forum_comments' THEN
    -- Get the post title
    SELECT title INTO post_title FROM forum_posts WHERE id = NEW.post_id;
    
    -- Notify post author about reply (if not self-reply)
    SELECT author_id INTO mentioned_profile FROM forum_posts WHERE id = NEW.post_id;
    IF mentioned_profile.author_id IS NOT NULL AND mentioned_profile.author_id != NEW.author_id THEN
      INSERT INTO notifications (profile_id, type, title, message, link, actor_id, post_id, comment_id)
      VALUES (
        (SELECT author_id FROM forum_posts WHERE id = NEW.post_id),
        'reply',
        'Neue Antwort auf deinen Beitrag',
        actor_name || ' hat auf "' || LEFT(post_title, 50) || '" geantwortet',
        '/forum?post=' || NEW.post_id,
        NEW.author_id,
        NEW.post_id,
        NEW.id
      );
    END IF;
    
    -- Find all @mentions in comment content
    FOR mention_match IN 
      SELECT DISTINCT (regexp_matches(NEW.content, '@([A-Za-zÄÖÜäöüß]+(?:\s[A-Za-zÄÖÜäöüß]+)?)', 'g'))[1]
    LOOP
      SELECT * INTO mentioned_profile FROM profiles 
      WHERE LOWER(nickname) = LOWER(mention_match) 
         OR LOWER(first_name || ' ' || last_name) = LOWER(mention_match)
         OR LOWER(first_name) = LOWER(mention_match)
      LIMIT 1;
      
      IF mentioned_profile.id IS NOT NULL AND mentioned_profile.id != NEW.author_id THEN
        INSERT INTO notifications (profile_id, type, title, message, link, actor_id, post_id, comment_id)
        VALUES (
          mentioned_profile.id,
          'mention',
          'Erwähnung in einem Kommentar',
          actor_name || ' hat dich in einem Kommentar erwähnt',
          '/forum?post=' || NEW.post_id,
          NEW.author_id,
          NEW.post_id,
          NEW.id
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for mentions/replies
CREATE TRIGGER on_forum_post_notify_mentions
AFTER INSERT ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();

CREATE TRIGGER on_forum_comment_notify_mentions
AFTER INSERT ON public.forum_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();