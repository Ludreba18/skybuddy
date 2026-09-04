-- Groups: any user can create a public or private group, invite members directly,
-- or (for public groups) accept join requests that arrive as a DM to the group admin.
-- Group posts show up in the main feed for members only, tagged with the group name.

CREATE TYPE group_visibility AS ENUM ('public', 'private');
CREATE TYPE group_member_role AS ENUM ('admin', 'member');
CREATE TYPE group_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  visibility group_visibility NOT NULL DEFAULT 'public',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, profile_id)
);

-- A request to join a PUBLIC group. Creating one opens (or reuses) a 1:1
-- conversation with the group's admin so they can chat before accepting/declining.
CREATE TABLE public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status group_request_status NOT NULL DEFAULT 'pending',
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, profile_id)
);

-- Direct, admin/member-initiated invitations (works for public AND private groups).
CREATE TABLE public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status group_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, invited_profile_id)
);

-- Posts can optionally belong to a group instead of (or as well as) the open feed.
ALTER TABLE public.posts ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
CREATE INDEX idx_posts_group ON public.posts(group_id) WHERE group_id IS NOT NULL;

-- Post media can now be video, not just images.
ALTER TABLE public.post_images ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_profile ON public.group_members(profile_id);
CREATE INDEX idx_group_join_requests_group ON public.group_join_requests(group_id);
CREATE INDEX idx_group_invitations_invited ON public.group_invitations(invited_profile_id);

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Helper + SECURITY DEFINER functions (mirrors the existing start_conversation
-- pattern: multi-step, security-sensitive operations go through one transaction
-- instead of relying on the client to do several separate inserts correctly).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND profile_id = get_current_profile_id()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND profile_id = get_current_profile_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.create_group(
  p_name TEXT,
  p_description TEXT,
  p_visibility group_visibility,
  p_avatar_url TEXT DEFAULT NULL,
  p_cover_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_group_id UUID;
BEGIN
  v_profile_id := get_current_profile_id();
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT has_active_access() THEN
    RAISE EXCEPTION 'Aktive Mitgliedschaft oder Testphase erforderlich';
  END IF;
  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Gruppenname erforderlich';
  END IF;

  INSERT INTO groups (name, description, visibility, avatar_url, cover_image_url, created_by)
  VALUES (trim(p_name), p_description, p_visibility, p_avatar_url, p_cover_image_url, v_profile_id)
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, profile_id, role)
  VALUES (v_group_id, v_profile_id, 'admin');

  RETURN v_group_id;
END;
$$;

-- Request to join a public group: opens/reuses a DM with the group's (first) admin
-- and records a pending request pointing at that conversation.
CREATE OR REPLACE FUNCTION public.request_to_join_group(p_group_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_admin_id UUID;
  v_visibility group_visibility;
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

  SELECT visibility INTO v_visibility FROM groups WHERE id = p_group_id;
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
  VALUES (v_conversation_id, v_profile_id, 'Hallo! Ich würde gerne der Gruppe beitreten.');

  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_join_request(p_request_id UUID, p_accept BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_request group_join_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM group_join_requests WHERE id = p_request_id;
  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Anfrage nicht gefunden';
  END IF;
  IF NOT is_group_admin(v_request.group_id) THEN
    RAISE EXCEPTION 'Nur Gruppen-Admins können Anfragen beantworten';
  END IF;

  UPDATE group_join_requests
  SET status = CASE WHEN p_accept THEN 'accepted'::group_request_status ELSE 'declined'::group_request_status END, updated_at = now()
  WHERE id = p_request_id;

  IF p_accept THEN
    INSERT INTO group_members (group_id, profile_id, role)
    VALUES (v_request.group_id, v_request.profile_id, 'member')
    ON CONFLICT (group_id, profile_id) DO NOTHING;
  END IF;

  IF v_request.conversation_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (
      v_request.conversation_id,
      get_current_profile_id(),
      CASE WHEN p_accept THEN 'Willkommen in der Gruppe! 🎉' ELSE 'Danke für dein Interesse, aber ich muss leider absagen.' END
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_to_group(p_group_id UUID, p_invited_profile_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_invitation_id UUID;
BEGIN
  v_profile_id := get_current_profile_id();
  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Nur Gruppenmitglieder können einladen';
  END IF;
  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND profile_id = p_invited_profile_id) THEN
    RAISE EXCEPTION 'Person ist bereits Mitglied';
  END IF;

  INSERT INTO group_invitations (group_id, invited_profile_id, invited_by, status)
  VALUES (p_group_id, p_invited_profile_id, v_profile_id, 'pending')
  ON CONFLICT (group_id, invited_profile_id)
  DO UPDATE SET status = 'pending', invited_by = excluded.invited_by, updated_at = now()
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_invitation(p_invitation_id UUID, p_accept BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_invitation group_invitations%ROWTYPE;
  v_profile_id UUID;
BEGIN
  v_profile_id := get_current_profile_id();
  SELECT * INTO v_invitation FROM group_invitations WHERE id = p_invitation_id;
  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'Einladung nicht gefunden';
  END IF;
  IF v_invitation.invited_profile_id <> v_profile_id THEN
    RAISE EXCEPTION 'Diese Einladung ist nicht für dich';
  END IF;

  UPDATE group_invitations
  SET status = CASE WHEN p_accept THEN 'accepted'::group_request_status ELSE 'declined'::group_request_status END, updated_at = now()
  WHERE id = p_invitation_id;

  IF p_accept THEN
    INSERT INTO group_members (group_id, profile_id, role)
    VALUES (v_invitation.group_id, v_profile_id, 'member')
    ON CONFLICT (group_id, profile_id) DO NOTHING;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_admin_count INT;
BEGIN
  v_profile_id := get_current_profile_id();

  SELECT count(*) INTO v_admin_count FROM group_members WHERE group_id = p_group_id AND role = 'admin';
  IF v_admin_count = 1 AND is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'Als letzter Admin kannst du die Gruppe nicht verlassen - lös sie stattdessen auf oder mach zuerst jemand anderen zum Admin';
  END IF;

  DELETE FROM group_members WHERE group_id = p_group_id AND profile_id = v_profile_id;
END;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- groups: public groups are discoverable by everyone; private groups only by members.
CREATE POLICY "Groups viewable by everyone or members"
  ON public.groups FOR SELECT
  USING (visibility = 'public' OR is_group_member(id));

-- All writes to groups/group_members/requests/invitations go through the
-- SECURITY DEFINER functions above, which run with elevated privileges - no
-- direct INSERT/UPDATE/DELETE policies are granted to regular users.
CREATE POLICY "Admins can update their group"
  ON public.groups FOR UPDATE
  USING (is_group_admin(id));

-- group_members: members can see who else is in a group they belong to.
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (is_group_member(group_id));

-- group_join_requests: visible to the requester and to the group's admins.
CREATE POLICY "Requesters and admins can view join requests"
  ON public.group_join_requests FOR SELECT
  USING (profile_id = get_current_profile_id() OR is_group_admin(group_id));

-- group_invitations: visible to the invited person and to the group's admins.
CREATE POLICY "Invitees and admins can view invitations"
  ON public.group_invitations FOR SELECT
  USING (invited_profile_id = get_current_profile_id() OR is_group_admin(group_id));

-- ============================================================================
-- Posts: extend visibility/insert rules to cover group posts
-- ============================================================================

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone or group members"
  ON public.posts FOR SELECT
  USING (group_id IS NULL OR is_group_member(group_id));

DROP POLICY IF EXISTS "Users with access can create posts" ON public.posts;
CREATE POLICY "Users with access can create posts or group posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    profile_id = get_current_profile_id()
    AND has_active_access()
    AND (group_id IS NULL OR is_group_member(group_id))
  );

-- ============================================================================
-- Storage bucket for group avatar/cover images
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Group images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'group-images');

CREATE POLICY "Group admins can upload group images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'group-images'
    AND has_active_access()
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Group admins can update group images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'group-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Group admins can delete group images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'group-images' AND auth.uid()::text = (storage.foldername(name))[1]);
