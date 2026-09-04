import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ForumPost } from "./useForum";

export function useTrendingPosts(limit: number = 5) {
  return useQuery({
    queryKey: ["trending-posts", limit],
    queryFn: async () => {
      // Get posts from the last 7 days with the most likes
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // 1. Fetch forum posts with categories
      const { data: posts, error: postsError } = await supabase
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
        .gte("created_at", oneWeekAgo.toISOString())
        .order("likes_count", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      // 2. Get unique author IDs
      const authorIds = [...new Set(posts.map(p => p.author_id))];

      // 3. Fetch author data from public_profiles (publicly accessible)
      const { data: profiles, error: profilesError } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      // 4. Create profile map and merge
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const postsWithAuthors = posts.map(post => ({
        ...post,
        author: profileMap.get(post.author_id) || null
      })) as ForumPost[];

      // Only return posts with at least 1 like
      return postsWithAuthors.filter(
        (post) => post.likes_count && post.likes_count > 0
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
