import { useEffect } from "react";
import { Loader2, Plane, TrendingUp } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { usePosts } from "@/hooks/usePosts";
import { useTrendingPosts } from "@/hooks/useTrendingPosts";
import PostCard from "./PostCard";
import TrendingPostCard from "./TrendingPostCard";
import CreatePostForm from "./CreatePostForm";

interface ActivityFeedProps {
  profileId?: string;
  userId?: string;
  avatarUrl?: string | null;
  isPremium?: boolean;
  showCreateForm?: boolean;
}

const ActivityFeed = ({ 
  profileId, 
  userId, 
  avatarUrl, 
  isPremium = false,
  showCreateForm = true 
}: ActivityFeedProps) => {
  const { 
    data, 
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePosts(10);
  
  const { data: trendingPosts } = useTrendingPosts(3);

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Auto-fetch next page when trigger element is visible
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all posts from all pages
  const allPosts = data?.pages.flatMap(page => page.posts) || [];

  return (
    <div className="space-y-4">
      {/* Create Post Form */}
      {showCreateForm && profileId && userId && (
        <div className="bg-card rounded-xl border border-border p-4">
          <CreatePostForm
            profileId={profileId}
            userId={userId}
            avatarUrl={avatarUrl}
            isPremium={isPremium}
          />
        </div>
      )}

      {/* Trending Posts */}
      {trendingPosts && trendingPosts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h4 className="font-heading font-semibold text-sm text-muted-foreground">
              Beliebt diese Woche
            </h4>
          </div>
          <div className="space-y-3">
            {trendingPosts.map((post) => (
              <TrendingPostCard key={`trending-${post.id}`} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Initial Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Fehler beim Laden der Beiträge.</p>
        </div>
      )}

      {/* Posts */}
      {allPosts.length > 0 ? (
        <div className="space-y-4">
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Infinite scroll trigger element */}
          <div ref={ref} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            )}
            {!hasNextPage && allPosts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Keine weiteren Beiträge
              </p>
            )}
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Plane className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-lg mb-1">Noch keine Beiträge</h3>
            <p className="text-sm text-muted-foreground">
              {isPremium 
                ? "Sei der Erste und teile dein Flugabenteuer!"
                : "Werde Premium, um Beiträge zu teilen."}
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default ActivityFeed;
