-- Allow users to update their own participation (specifically last_read_at)
CREATE POLICY "Users can update own participation"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (profile_id = public.get_current_profile_id())
WITH CHECK (profile_id = public.get_current_profile_id());