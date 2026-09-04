-- Use security definer function to avoid RLS side-effects and ensure consistent premium check

DROP POLICY IF EXISTS "Premium users can create conversations" ON public.conversations;
CREATE POLICY "Premium users can create conversations"
ON public.conversations
FOR INSERT
TO public
WITH CHECK (public.is_current_user_premium());

DROP POLICY IF EXISTS "Premium users can add participants" ON public.conversation_participants;
CREATE POLICY "Premium users can add participants"
ON public.conversation_participants
FOR INSERT
TO public
WITH CHECK (public.is_current_user_premium());