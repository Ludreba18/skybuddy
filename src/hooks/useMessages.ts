import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useMarkConversationRead } from "./useConversations";
import { useEffect } from "react";

export interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  conversation_id: string;
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const markAsRead = useMarkConversationRead();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      // Get messages first
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("id, content, created_at, sender_id, conversation_id")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!messagesData?.length) return [];

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];


       // Fetch sender profiles via SECURITY DEFINER function (bypasses RLS safely)
       const senderProfiles = (
         await Promise.all(
           senderIds.map(async (id) => {
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
       }[];

      // Create a lookup map
      const profileMap = new Map(senderProfiles?.map(p => [p.id, p]) || []);

      // Merge messages with sender data
      return messagesData.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id) || {
          id: msg.sender_id,
          first_name: null,
          last_name: null,
          nickname: null,
          avatar_url: null
        }
      })) as Message[];
    },
    enabled: !!conversationId,
    staleTime: 0, // Always refetch when conversation changes
    refetchOnMount: "always",
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          // Small delay to ensure the message is committed before refetching
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
            // This conversation is open on screen right now, so a message that
            // just arrived counts as seen immediately - clears the unread badge
            // live instead of waiting for the next click into the conversation.
            markAsRead(conversationId);
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, markAsRead]);

  return query;
}

export function useSendMessage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
