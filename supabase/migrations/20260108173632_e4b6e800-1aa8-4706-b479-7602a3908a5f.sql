-- Create a SECURITY DEFINER function to start conversations
-- This bypasses RLS recursion issues by handling everything in one transaction

CREATE OR REPLACE FUNCTION public.start_conversation(other_profile_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_profile_id uuid;
  existing_conv_id uuid;
  new_conv_id uuid;
BEGIN
  -- Get current user's profile id
  current_profile_id := get_current_profile_id();
  
  IF current_profile_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is premium
  IF NOT is_current_user_premium() THEN
    RAISE EXCEPTION 'Premium membership required';
  END IF;
  
  -- Check for existing conversation between these two users
  SELECT cp1.conversation_id INTO existing_conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN conversations c ON c.id = cp1.conversation_id
  WHERE cp1.profile_id = current_profile_id
    AND cp2.profile_id = other_profile_id
    AND c.is_group = false
  LIMIT 1;
  
  IF existing_conv_id IS NOT NULL THEN
    RETURN existing_conv_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations (is_group) VALUES (false) RETURNING id INTO new_conv_id;
  
  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, profile_id)
  VALUES 
    (new_conv_id, current_profile_id),
    (new_conv_id, other_profile_id);
  
  RETURN new_conv_id;
END;
$$;