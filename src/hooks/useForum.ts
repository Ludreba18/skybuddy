import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  category_id: string;
  likes_count: number | null;
  comments_count: number | null;
  image_url?: string | null;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
  category?: ForumCategory;
  user_has_liked?: boolean;
}

export interface ForumComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  post_id: string;
  image_url?: string | null;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
}

export function useForumCategories() {
  return useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      return data as ForumCategory[];
    },
  });
}

export function useForumPosts(categoryId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["forum-posts", categoryId],
    queryFn: async () => {
      // 1. Fetch posts with categories
      let query = supabase
        .from("forum_posts")
        .select(`
          *,
          category:forum_categories!forum_posts_category_id_fkey (
            id,
            name,
            description,
            icon,
            sort_order
          )
        `)
        .order("created_at", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data: posts, error: postsError } = await query;
      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      // 2. Get unique author IDs
      const authorIds = [...new Set(posts.map(p => p.author_id))];

      // 3. Fetch author data from public_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      // 4. Create profile map
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // 5. Check if user has liked each post
      let likedPostIds = new Set<string>();
      if (profile?.id) {
        const { data: likes } = await supabase
          .from("forum_post_likes")
          .select("post_id")
          .eq("profile_id", profile.id);

        likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
      }

      return posts.map((post) => ({
        ...post,
        author: profileMap.get(post.author_id) || null,
        user_has_liked: likedPostIds.has(post.id),
      })) as ForumPost[];
    },
  });
}

export function useForumPost(postId: string | null) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["forum-post", postId],
    queryFn: async () => {
      if (!postId) return null;

      // 1. Fetch post with category
      const { data: post, error: postError } = await supabase
        .from("forum_posts")
        .select(`
          *,
          category:forum_categories!forum_posts_category_id_fkey (
            id,
            name,
            description,
            icon,
            sort_order
          )
        `)
        .eq("id", postId)
        .single();

      if (postError) throw postError;

      // 2. Fetch author data from public_profiles
      const { data: authorData, error: authorError } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .eq("id", post.author_id)
        .single();

      if (authorError && authorError.code !== 'PGRST116') throw authorError;

      // 3. Check if user has liked
      let userHasLiked = false;
      if (profile?.id) {
        const { data: like } = await supabase
          .from("forum_post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("profile_id", profile.id)
          .maybeSingle();

        userHasLiked = !!like;
      }

      return {
        ...post,
        author: authorData || null,
        user_has_liked: userHasLiked,
      } as ForumPost;
    },
    enabled: !!postId,
  });
}

export function useForumComments(postId: string | null) {
  return useQuery({
    queryKey: ["forum-comments", postId],
    queryFn: async () => {
      if (!postId) return [];

      // 1. Fetch comments
      const { data: comments, error: commentsError } = await supabase
        .from("forum_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      if (!comments || comments.length === 0) return [];

      // 2. Get unique author IDs
      const authorIds = [...new Set(comments.map(c => c.author_id))];

      // 3. Fetch author data from public_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      // 4. Create profile map and merge
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return comments.map((comment) => ({
        ...comment,
        author: profileMap.get(comment.author_id) || null,
      })) as ForumComment[];
    },
    enabled: !!postId,
  });
}

// Fetch all profiles for @mentions
export function useProfiles() {
  return useQuery({
    queryKey: ["profiles-mentions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .order("first_name");

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateForumPost() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      categoryId,
      imageUrl,
    }: {
      title: string;
      content: string;
      categoryId: string;
      imageUrl?: string;
    }) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("forum_posts")
        .insert({
          title,
          content,
          category_id: categoryId,
          author_id: profile.id,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    },
  });
}

export function useUpdateForumPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      title,
      content,
      imageUrl,
    }: {
      postId: string;
      title: string;
      content: string;
      imageUrl?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("forum_posts")
        .update({
          title,
          content,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", variables.postId] });
    },
  });
}

export function useDeleteForumPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    },
  });
}

export function useCreateForumComment() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      imageUrl,
    }: {
      postId: string;
      content: string;
      imageUrl?: string;
    }) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("forum_comments")
        .insert({
          post_id: postId,
          content,
          author_id: profile.id,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forum-comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", variables.postId] });
    },
  });
}

export function useUpdateForumComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId,
      content,
      imageUrl,
    }: {
      commentId: string;
      postId: string;
      content: string;
      imageUrl?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("forum_comments")
        .update({
          content,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forum-comments", variables.postId] });
    },
  });
}

export function useDeleteForumComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from("forum_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forum-comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", variables.postId] });
    },
  });
}

export function useToggleForumLike() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (!profile?.id) throw new Error("Not authenticated");

      if (hasLiked) {
        const { error } = await supabase
          .from("forum_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("profile_id", profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forum_post_likes")
          .insert({
            post_id: postId,
            profile_id: profile.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", variables.postId] });
    },
  });
}

// Upload image to forum-images bucket
export async function uploadForumImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("forum-images")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("forum-images")
    .getPublicUrl(fileName);

  return publicUrl;
}
