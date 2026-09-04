import { useState } from "react";
import { MessageSquare, Plus, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryCard } from "@/components/forum/CategoryCard";
import { PostCard } from "@/components/forum/PostCard";
import { PostDetail } from "@/components/forum/PostDetail";
import { CreatePostDialog } from "@/components/forum/CreatePostDialog";
import { useForumCategories, useForumPosts, useForumPost, useToggleForumLike, ForumPost } from "@/hooks/useForum";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const Forum = () => {
  const { profile } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editPost, setEditPost] = useState<ForumPost | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useForumCategories();
  const { data: posts = [], isLoading: postsLoading } = useForumPosts(selectedCategoryId || undefined);
  const { data: selectedPost } = useForumPost(selectedPostId);
  const toggleLike = useToggleForumLike();

  // Filter posts by search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)
    );
  });

  // Count posts per category
  const categoryPostCounts = posts.reduce((acc, post) => {
    acc[post.category_id] = (acc[post.category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleLike = (post: ForumPost) => {
    toggleLike.mutate({
      postId: post.id,
      hasLiked: post.user_has_liked || false,
    });
  };

  const handleEditPost = (post: ForumPost) => {
    setSelectedPostId(null);
    setEditPost(post);
    setShowCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setEditPost(null);
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <DashboardLayout>
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="section-decoration-blob w-80 h-80 top-1/4 -right-40 opacity-5" />
      </div>

      <main className="container mx-auto px-4 py-6 relative">
        {/* Page Header - Enhanced */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading">Forum</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Diskutiere mit der Community</p>
            </div>
          </div>
          {profile && (
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Neuer Beitrag</span>
            </Button>
          )}
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories">Kategorien</TabsTrigger>
            <TabsTrigger value="all">Alle Beiträge</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            {/* Category Selection */}
            {!selectedCategoryId ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Wähle eine Kategorie</h2>
                {categoriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      postCount={categoryPostCounts[category.id] || 0}
                      onClick={() => setSelectedCategoryId(category.id)}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategoryId(null)}
                    >
                      ← Zurück
                    </Button>
                    <h2 className="text-lg font-semibold">{selectedCategory?.name}</h2>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Beiträge durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Posts List */}
                {postsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Noch keine Beiträge in dieser Kategorie.</p>
                    {profile && (
                      <Button
                        variant="link"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        Erstelle den ersten Beitrag!
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onClick={() => setSelectedPostId(post.id)}
                        onLike={() => handleLike(post)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Beiträge durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* All Posts */}
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Noch keine Beiträge vorhanden.</p>
                {profile && (
                  <Button
                    variant="link"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Erstelle den ersten Beitrag!
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => setSelectedPostId(post.id)}
                    onLike={() => handleLike(post)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Post Detail Sheet */}
        <PostDetail
          post={selectedPost || null}
          open={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onEdit={handleEditPost}
        />

        {/* Create/Edit Post Dialog */}
        <CreatePostDialog
          open={showCreateDialog}
          onClose={handleCloseCreateDialog}
          defaultCategoryId={selectedCategoryId || undefined}
          editPost={editPost}
        />
      </main>
    </DashboardLayout>
  );
};

export default Forum;
