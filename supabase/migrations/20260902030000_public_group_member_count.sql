-- Public groups showed "0 Mitglieder" to everyone except actual members: the
-- group_members SELECT policy only allowed members to see membership rows at
-- all, so the member-count query in the public groups directory came back
-- empty for anyone who wasn't already in the group. Public groups' membership
-- (just for counting/listing - who's an admin, etc.) should be visible to any
-- authenticated user, same as the group row itself; private groups stay
-- members-only.
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (
    is_group_member(group_id)
    OR EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.visibility = 'public')
  );
