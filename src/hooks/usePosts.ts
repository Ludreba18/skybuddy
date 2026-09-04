import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PostMedia {
  url: string;
  type: "image" | "video";
}

export interface Post {
  id: string;
  profile_id: string;
  content: string | null;
  image_url: string | null;
  images: string[];
  media: PostMedia[];
  created_at: string;
  group_id: string | null;
  group: { id: string; name: string; avatar_url: string | null } | null;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    home_airport_icao: string | null;
    flight_hours: number | null;
  } | null;
}

interface PostsPage {
  posts: Post[];
  nextPage: number | undefined;
}

export const usePosts = (pageSize: number = 10) => {
  return useInfiniteQuery<PostsPage>({
    queryKey: ["posts", pageSize],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // 1. Fetch posts with pagination and post_images
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          profile_id,
          content,
          image_url,
          created_at,
          group_id,
          group:groups(id, name, avatar_url),
          post_images(image_url, position, media_type)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) {
        return { posts: [], nextPage: undefined };
      }

      // 2. Get unique profile IDs
      const profileIds = [...new Set(posts.map(p => p.profile_id))];

      // 3. Fetch profile data from public_profiles (publicly accessible)
      const { data: profiles, error: profilesError } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url, home_airport_icao, flight_hours")
        .in("id", profileIds);

      if (profilesError) throw profilesError;

      // 4. Create profile map and merge
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const mergedPosts = posts.map(post => {
        // Build images array: prefer post_images, fallback to image_url
        // Filter out empty/invalid URLs
        const postImages = (post.post_images || [])
          .sort((a, b) => a.position - b.position)
          .map(img => img.image_url)
          .filter(url => url && url.trim().length > 0);
        
        const images = postImages.length > 0
          ? postImages
          : (post.image_url && post.image_url.trim().length > 0)
            ? [post.image_url]
            : [];

        const media: PostMedia[] = (post.post_images || []).length > 0
          ? (post.post_images || [])
              .slice()
              .sort((a, b) => a.position - b.position)
              .filter((m) => m.image_url && m.image_url.trim().length > 0)
              .map((m) => ({ url: m.image_url, type: (m.media_type as "image" | "video") || "image" }))
          : images.map((url) => ({ url, type: "image" as const }));

        return {
          id: post.id,
          profile_id: post.profile_id,
          content: post.content,
          image_url: post.image_url,
          images,
          media,
          created_at: post.created_at,
          group_id: post.group_id,
          group: (post.group as unknown as Post["group"]) || null,
          profile: profileMap.get(post.profile_id) || null,
        };
      }) as Post[];

      return {
        posts: mergedPosts,
        nextPage: posts.length === pageSize ? page + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 60 * 1000, // 1 minute
  });
};
