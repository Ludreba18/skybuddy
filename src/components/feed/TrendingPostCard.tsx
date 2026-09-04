import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { TrendingUp, Heart, MessageCircle, Image } from "lucide-react";
import { ForumPost } from "@/hooks/useForum";
import { Badge } from "@/components/ui/badge";
import { ClickableProfile } from "@/components/shared/ClickableProfile";

interface TrendingPostCardProps {
  post: ForumPost;
}

const TrendingPostCard = ({ post }: TrendingPostCardProps) => {
  const authorName =
    post.author?.nickname ||
    `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim() ||
    "Unbekannter Pilot";

  return (
    <Link
      to={`/forum?post=${post.id}`}
      className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
    >
      {/* Trending Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge 
          variant="secondary" 
          className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 gap-1"
        >
          <TrendingUp className="w-3 h-3" />
          Trending
        </Badge>
        {post.category && (
          <Badge variant="outline" className="text-xs">
            {post.category.name}
          </Badge>
        )}
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 mb-2">
        <ClickableProfile
          profile={{
            id: post.author?.id || post.author_id,
            first_name: post.author?.first_name,
            last_name: post.author?.last_name,
            nickname: post.author?.nickname,
            avatar_url: post.author?.avatar_url,
          }}
          showAvatar
          avatarSize="sm"
        />
        <span className="text-xs text-muted-foreground">
          · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: de })}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-heading font-semibold text-sm mb-2 line-clamp-2">
        {post.title}
      </h4>

      {/* Content Preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {post.content}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-red-500" />
          {post.likes_count || 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" />
          {post.comments_count || 0}
        </span>
        {post.image_url && (
          <span className="flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </Link>
  );
};

export default TrendingPostCard;
