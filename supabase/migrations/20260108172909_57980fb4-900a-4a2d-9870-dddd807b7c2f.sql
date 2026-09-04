-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view own participations" ON conversation_participants;

-- Create a simple non-recursive policy using the helper function
CREATE POLICY "Users can view own participations"
ON conversation_participants
FOR SELECT
USING (profile_id = public.get_current_profile_id());

-- Also fix conversations SELECT policy that has similar issue
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;

-- First we need to allow users to see their conversation_participants to then check conversations
-- But since conversation_participants is now fixed, we can use it
CREATE POLICY "Participants can view conversations"
ON conversations
FOR SELECT
USING (id IN (
  SELECT conversation_id 
  FROM conversation_participants 
  WHERE profile_id = public.get_current_profile_id()
));

-- Fix messages SELECT policy
DROP POLICY IF EXISTS "Participants can view messages" ON messages;

CREATE POLICY "Participants can view messages"
ON messages
FOR SELECT
USING (conversation_id IN (
  SELECT conversation_id 
  FROM conversation_participants 
  WHERE profile_id = public.get_current_profile_id()
));

-- Fix messages INSERT policy
DROP POLICY IF EXISTS "Participants can send messages" ON messages;

CREATE POLICY "Participants can send messages"
ON messages
FOR INSERT
WITH CHECK (
  sender_id = public.get_current_profile_id()
  AND conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE profile_id = public.get_current_profile_id()
  )
);