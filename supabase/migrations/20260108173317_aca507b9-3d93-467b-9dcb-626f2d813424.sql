-- Fix INSERT policies to apply to authenticated users explicitly

DROP POLICY IF EXISTS "Premium users can create conversations" ON public.conversations;
CREATE POLICY "Premium users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_premium());

DROP POLICY IF EXISTS "Premium users can add participants" ON public.conversation_participants;
CREATE POLICY "Premium users can add participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_premium());