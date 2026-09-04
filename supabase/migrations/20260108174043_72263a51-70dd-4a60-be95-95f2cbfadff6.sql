-- Allow participants to see ALL participants in conversations they are part of
-- Uses SECURITY DEFINER to avoid recursive RLS.

CREATE OR REPLACE FUNCTION public.can_view_conversation(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.profile_id = public.get_current_profile_id()
  );
$$;

DROP POLICY IF EXISTS "Users can view own participations" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation participants"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (public.can_view_conversation(conversation_id));
