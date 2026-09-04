import { useState } from "react";
import { ForumPost } from "@/hooks/useForum";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, Image } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ClickableProfile } from "@/components/shared/ClickableProfile";
import { ImageLightbox } from "@/components/shared/ImageLightbox";

interface PostCardProps {
  post: ForumPost;
  onClick: () => void;
  onLike: () => void;
}

export function PostCard({ post, onClick, onLike }: PostCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const authorName = post.author?.nickname || 
    `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim() || 
    "Unbekannt";

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {post.author && (
              <ClickableProfile
                profile={post.author}
                showName={false}
                avatarSize="lg"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
                {post.image_url && (
                  <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {post.author ? (
                  <ClickableProfile
                    profile={post.author}
                    showAvatar={false}
                    nameClassName="text-muted-foreground hover:text-primary"
                  />
                ) : (
                  <span className="truncate">{authorName}</span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: de 
                  })}
                </span>
              </div>
            </div>
          </div>
          {post.category && (
            <Badge variant="secondary" className="flex-shrink-0">
              {post.category.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
        {post.image_url && (
          <>
            <img 
              src={post.image_url} 
              alt="Beitrags-Vorschau" 
              className="mb-4 rounded-lg max-h-48 object-cover w-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
            />
            <ImageLightbox
              images={[post.image_url]}
              content={post.content}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />
          </>
        )}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1 ${post.user_has_liked ? "text-red-500" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
          >
            <Heart className={`h-4 w-4 ${post.user_has_liked ? "fill-current" : ""}`} />
            {post.likes_count || 0}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.comments_count || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
