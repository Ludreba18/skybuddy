import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCallback, useEffect } from "react";

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  participants: {
    profile_id: string;
    profile: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      nickname: string | null;
      avatar_url: string | null;
      last_seen_at: string | null;
    };
  }[];
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
}

export function useConversations() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime message updates to refresh conversation list
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('conversations-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Small delay to ensure the message is committed before refetching
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["conversations", profile.id] });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  return useQuery({
    queryKey: ["conversations", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get conversations where user is a participant
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", profile.id);

      if (partError) throw partError;
      if (!participations?.length) return [];

      const conversationIds = participations.map(p => p.conversation_id);

      // Get full conversation data
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select(`
          id,
          name,
          is_group,
          created_at,
          updated_at
        `)
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        (conversations || []).map(async (conv) => {
          // First get participant profile_ids
          const { data: participantLinks } = await supabase
            .from("conversation_participants")
            .select("profile_id, last_read_at")
            .eq("conversation_id", conv.id);


          // Then get profile info via SECURITY DEFINER function (bypasses RLS safely)
          const profileIds = (participantLinks || []).map((p) => p.profile_id);
          const profiles = (
            await Promise.all(
              profileIds.map(async (id) => {
                const { data } = await supabase.rpc("get_public_profile", { profile_id: id });
                return data?.[0] ?? null;
              })
            )
          ).filter(Boolean) as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            nickname: string | null;
            avatar_url: string | null;
            last_seen_at: string | null;
          }[];

          // Merge participant data with profile info
          const participants = (participantLinks || []).map(link => {
            const profileData = profiles?.find(p => p.id === link.profile_id);
            return {
              profile_id: link.profile_id,
              last_read_at: link.last_read_at,
              profile: profileData || {
                id: link.profile_id,
                first_name: null,
                last_name: null,
                nickname: null,
                avatar_url: null,
                last_seen_at: null
              }
            };
          });

          // Get last message
          const { data: messages } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Find current user's participation from the merged data
          const myParticipation = participants?.find(p => p.profile_id === profile.id);
          const lastReadAt = myParticipation?.last_read_at;
          
          let unreadCount = 0;
          if (lastReadAt) {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .gt("created_at", lastReadAt)
              .neq("sender_id", profile.id);
            unreadCount = count || 0;
          } else {
            // If never read, count all messages not from current user
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .neq("sender_id", profile.id);
            unreadCount = count || 0;
          }

          return {
            ...conv,
            participants: (participants || []).map(p => ({
              profile_id: p.profile_id,
              profile: p.profile as any
            })),
            last_message: messages?.[0],
            unread_count: unreadCount
          };
        })
      );

      return conversationsWithParticipants as Conversation[];
    },
    enabled: !!profile?.id,
    // Override the app-wide staleTime/refetchOnMount=false defaults: this list is
    // only kept live by realtime while the Messages page itself is mounted, so a
    // message that arrives while the user is elsewhere would otherwise show a
    // stale preview/unread count until something else happened to invalidate it.
    // Always refetching on mount means visiting the tab is enough on its own.
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useStartConversation() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherProfileId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");

      // Use the SECURITY DEFINER function to handle everything in one transaction
      const { data, error } = await supabase.rpc('start_conversation', {
        other_profile_id: otherProfileId
      });

      if (error) throw error;

      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkConversationRead() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!profile?.id) return;

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("profile_id", profile.id);

    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [profile?.id, queryClient]);

  return markAsRead;
}
