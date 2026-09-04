-- Include the group's name in the auto-sent join-request message (it just said
-- "Ich möchte der Gruppe beitreten" with no indication of which group).
CREATE OR REPLACE FUNCTION public.request_to_join_group(p_group_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_admin_id UUID;
  v_visibility group_visibility;
  v_group_name TEXT;
  v_conversation_id UUID;
  v_existing_status group_request_status;
BEGIN
  v_profile_id := get_current_profile_id();
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT has_active_access() THEN
    RAISE EXCEPTION 'Aktive Mitgliedschaft oder Testphase erforderlich';
  END IF;

  SELECT visibility, name INTO v_visibility, v_group_name FROM groups WHERE id = p_group_id;
  IF v_visibility IS NULL THEN
    RAISE EXCEPTION 'Gruppe nicht gefunden';
  END IF;
  IF v_visibility <> 'public' THEN
    RAISE EXCEPTION 'Diese Gruppe ist privat - du kannst nur per Einladung beitreten';
  END IF;

  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND profile_id = v_profile_id) THEN
    RAISE EXCEPTION 'Du bist bereits Mitglied dieser Gruppe';
  END IF;

  SELECT status, conversation_id INTO v_existing_status, v_conversation_id
  FROM group_join_requests WHERE group_id = p_group_id AND profile_id = v_profile_id;

  IF v_existing_status = 'pending' THEN
    RETURN v_conversation_id;
  END IF;

  SELECT profile_id INTO v_admin_id
  FROM group_members WHERE group_id = p_group_id AND role = 'admin'
  ORDER BY joined_at ASC LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Kein Admin für diese Gruppe gefunden';
  END IF;

  v_conversation_id := start_conversation(v_admin_id);

  INSERT INTO group_join_requests (group_id, profile_id, status, conversation_id)
  VALUES (p_group_id, v_profile_id, 'pending', v_conversation_id)
  ON CONFLICT (group_id, profile_id)
  DO UPDATE SET status = 'pending', conversation_id = excluded.conversation_id, updated_at = now();

  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (v_conversation_id, v_profile_id, 'Hallo! Ich würde gerne der Gruppe "' || v_group_name || '" beitreten.');

  RETURN v_conversation_id;
END;
$$;
