import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Post, PostMedia } from "./usePosts";

export type GroupVisibility = "public" | "private";
export type GroupMemberRole = "admin" | "member";
export type GroupRequestStatus = "pending" | "accepted" | "declined";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  visibility: GroupVisibility;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  profile_id: string;
  role: GroupMemberRole;
  joined_at: string;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  profile_id: string;
  status: GroupRequestStatus;
  conversation_id: string | null;
  created_at: string;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
  group?: Pick<Group, "id" | "name" | "avatar_url">;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_profile_id: string;
  invited_by: string;
  status: GroupRequestStatus;
  created_at: string;
  group?: Pick<Group, "id" | "name" | "avatar_url">;
}

// All public groups (discoverable, joinable via request).
export function usePublicGroups() {
  return useQuery({
    queryKey: ["groups", "public"],
    queryFn: async () => {
      const { data: groups, error } = await supabase
        .from("groups")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const counts = await Promise.all(
        (groups || []).map((g) =>
          supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", g.id)
        )
      );

      return (groups || []).map((g, i) => ({
        ...g,
        member_count: counts[i].count || 0,
      })) as Group[];
    },
  });
}

// Groups the current user is a member of.
export function useMyGroups() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["groups", "mine", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from("group_members")
        .select("role, group:groups(*)")
        .eq("profile_id", profile!.id);
      if (error) throw error;

      const groups = (memberships || []).filter((m) => m.group);
      const counts = await Promise.all(
        groups.map((m) =>
          supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", (m.group as unknown as Group).id)
        )
      );

      return groups.map((m, i) => ({
        ...(m.group as unknown as Group),
        myRole: m.role as GroupMemberRole,
        member_count: counts[i].count || 0,
      }));
    },
  });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("*").eq("id", groupId!).single();
      if (error) throw error;
      return data as Group;
    },
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-members", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("id, group_id, profile_id, role, joined_at")
        .eq("group_id", groupId!)
        .order("joined_at", { ascending: true });
      if (error) throw error;

      const profileIds = (data || []).map((m) => m.profile_id);
      if (profileIds.length === 0) return [] as GroupMember[];

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .in("id", profileIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      return (data || []).map((m) => ({ ...m, profile: profileMap.get(m.profile_id) })) as GroupMember[];
    },
  });
}

// Current user's membership info for one group (role, or null if not a member).
export function useMyMembership(groupId: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["group-membership", groupId, profile?.id],
    enabled: !!groupId && !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId!)
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { role: GroupMemberRole } | null;
    },
  });
}

// Looks up whether the conversation currently open in Messages has a pending
// group join request attached, so the admin can accept/decline right there
// instead of having to go find the group's own page.
export function useJoinRequestForConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["group-join-request-for-conversation", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_join_requests")
        .select("*, group:groups(id, name, avatar_url)")
        .eq("conversation_id", conversationId!)
        .eq("status", "pending")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: profileData } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .eq("id", data.profile_id)
        .maybeSingle();

      return { ...data, profile: profileData } as unknown as GroupJoinRequest;
    },
  });
}

export function usePendingJoinRequests(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-join-requests", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_join_requests")
        .select("*")
        .eq("group_id", groupId!)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const profileIds = (data || []).map((r) => r.profile_id);
      if (profileIds.length === 0) return [] as GroupJoinRequest[];

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .in("id", profileIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return (data || []).map((r) => ({ ...r, profile: profileMap.get(r.profile_id) })) as GroupJoinRequest[];
    },
  });
}

export function useMyInvitations() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["group-invitations", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_invitations")
        .select("*, group:groups(id, name, avatar_url)")
        .eq("invited_profile_id", profile!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as GroupInvitation[];
    },
  });
}

// Posts within a single group (used on the group's own detail page - the main
// feed's usePosts() already includes these for members via RLS).
export function useGroupPosts(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-posts", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("id, profile_id, content, image_url, created_at, group_id, post_images(image_url, position, media_type)")
        .eq("group_id", groupId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!posts || posts.length === 0) return [] as Post[];

      const profileIds = [...new Set(posts.map((p) => p.profile_id))];
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url, home_airport_icao, flight_hours")
        .in("id", profileIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return posts.map((post) => {
        const media: PostMedia[] = (post.post_images || []).length > 0
          ? (post.post_images || [])
              .slice()
              .sort((a, b) => a.position - b.position)
              .filter((m) => m.image_url && m.image_url.trim().length > 0)
              .map((m) => ({ url: m.image_url, type: (m.media_type as "image" | "video") || "image" }))
          : post.image_url
            ? [{ url: post.image_url, type: "image" as const }]
            : [];

        return {
          id: post.id,
          profile_id: post.profile_id,
          content: post.content,
          image_url: post.image_url,
          images: media.map((m) => m.url),
          media,
          created_at: post.created_at,
          group_id: post.group_id,
          group: null,
          profile: profileMap.get(post.profile_id) || null,
        } as Post;
      });
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      visibility: GroupVisibility;
      avatarUrl?: string | null;
      coverImageUrl?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("create_group", {
        p_name: input.name,
        p_description: input.description || null,
        p_visibility: input.visibility,
        p_avatar_url: input.avatarUrl || null,
        p_cover_image_url: input.coverImageUrl || null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Gruppe erstellt", description: "Deine Gruppe ist startklar." });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
}

export function useRequestToJoinGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc("request_to_join_group", { p_group_id: groupId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Beitrittsanfrage gesendet",
        description: "Der Gruppen-Admin wurde per Chat benachrichtigt.",
      });
      navigate(`/messages?conversation=${conversationId}`);
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
}

export function useRespondToJoinRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { error } = await supabase.rpc("respond_to_join_request", {
        p_request_id: requestId,
        p_accept: accept,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["group-join-request-for-conversation"] });
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      queryClient.invalidateQueries({ queryKey: ["group-membership"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: variables.accept ? "Anfrage angenommen" : "Anfrage abgelehnt",
        description: variables.accept ? "Die Person ist jetzt Mitglied der Gruppe." : undefined,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
}

export function useInviteToGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, profileId }: { groupId: string; profileId: string }) => {
      const { error } = await supabase.rpc("invite_to_group", {
        p_group_id: groupId,
        p_invited_profile_id: profileId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-invitations"] });
      toast({ title: "Einladung gesendet" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ invitationId, accept }: { invitationId: string; accept: boolean }) => {
      const { error } = await supabase.rpc("respond_to_invitation", {
        p_invitation_id: invitationId,
        p_accept: accept,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      toast({ title: "Erledigt" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.rpc("leave_group", { p_group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      queryClient.invalidateQueries({ queryKey: ["group-membership"] });
      toast({ title: "Gruppe verlassen" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
}
