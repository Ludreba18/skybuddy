import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Users } from "lucide-react";
import type { Post, PostMedia } from "@/hooks/usePosts";
import { ClickableProfile } from "@/components/shared/ClickableProfile";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { FeedImage } from "@/components/feed/FeedImage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
}

function PostMediaItem({ media, className, onClick }: { media: PostMedia; className?: string; onClick?: () => void }) {
  if (media.type === "video") {
    return (
      <video
        src={media.url}
        className={cn("object-cover cursor-pointer", className)}
        controls
        onClick={onClick}
      />
    );
  }
  return <FeedImage src={media.url} className={className} onClick={onClick} />;
}

const PostCard = ({ post }: PostCardProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  const profile = post.profile;
  const displayName = profile?.nickname || 
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || 
    "Pilot";
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { 
    addSuffix: true, 
    locale: de 
  });

  // Use media array if available, fallback to image_url. Filter out empty/invalid URLs.
  const media: PostMedia[] = (post.media?.length > 0
    ? post.media
    : post.image_url
      ? [{ url: post.image_url, type: "image" as const }]
      : []
  ).filter((m) => m.url && m.url.trim().length > 0);

  // The lightbox only knows about images, so videos are excluded from it and
  // grid positions are remapped to their index within the image-only subset.
  const imageOnlyUrls = media.filter((m) => m.type === "image").map((m) => m.url);
  let imageCounter = -1;
  const lightboxIndexByPosition = media.map((m) => (m.type === "image" ? ++imageCounter : -1));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/20 transition-colors">
      {/* Group badge - shown above the author when this post was made in a group */}
      {post.group && (
        <Link
          to={`/groups/${post.group.id}`}
          className="flex items-center gap-1.5 px-4 pt-3 text-xs font-medium text-primary hover:underline"
        >
          <Users className="w-3.5 h-3.5" />
          {post.group.name}
        </Link>
      )}

      {/* Post Header */}
      <div className="p-4 flex items-center gap-3">
        {profile ? (
          <ClickableProfile
            profile={{
              id: profile.id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              nickname: profile.nickname,
              avatar_url: profile.avatar_url,
              home_airport_icao: profile.home_airport_icao,
              flight_hours: profile.flight_hours,
            }}
            showName={false}
            avatarSize="lg"
            className="shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{displayName.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {profile ? (
            <ClickableProfile
              profile={{
                id: profile.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                nickname: profile.nickname,
                avatar_url: profile.avatar_url,
              }}
              showAvatar={false}
              nameClassName="text-sm truncate block"
            />
          ) : (
            <span className="font-medium text-sm truncate block">{displayName}</span>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            {profile?.home_airport_icao && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.home_airport_icao}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post Media */}
      {media.length > 0 && (
        <div className={cn(
          "bg-muted",
          media.length === 1 && "aspect-video",
          media.length > 1 && "grid gap-0.5",
          media.length === 2 && "grid-cols-2 aspect-[2/1]",
          media.length === 3 && "grid-cols-2 aspect-[4/3]",
          media.length === 4 && "grid-cols-2 aspect-square",
          media.length === 5 && "grid-cols-6 grid-rows-2 aspect-[3/2]"
        )}>
          {media.length === 1 ? (
            <PostMediaItem
              media={media[0]}
              className="w-full h-full"
              onClick={media[0].type === "image" ? () => openLightbox(lightboxIndexByPosition[0]) : undefined}
            />
          ) : media.length === 2 ? (
            media.map((m, idx) => (
              <PostMediaItem
                key={idx}
                media={m}
                className="w-full h-full"
                onClick={m.type === "image" ? () => openLightbox(lightboxIndexByPosition[idx]) : undefined}
              />
            ))
          ) : media.length === 3 ? (
            <>
              <PostMediaItem
                media={media[0]}
                className="w-full h-full row-span-2"
                onClick={media[0].type === "image" ? () => openLightbox(lightboxIndexByPosition[0]) : undefined}
              />
              {media.slice(1).map((m, idx) => (
                <PostMediaItem
                  key={idx}
                  media={m}
                  className="w-full h-full"
                  onClick={m.type === "image" ? () => openLightbox(lightboxIndexByPosition[idx + 1]) : undefined}
                />
              ))}
            </>
          ) : media.length === 4 ? (
            media.map((m, idx) => (
              <PostMediaItem
                key={idx}
                media={m}
                className="w-full h-full"
                onClick={m.type === "image" ? () => openLightbox(lightboxIndexByPosition[idx]) : undefined}
              />
            ))
          ) : (
            <>
              {/* 5 items: first 2 take 3 cols each top row, bottom 3 take 2 cols each */}
              <PostMediaItem
                media={media[0]}
                className="w-full h-full col-span-3"
                onClick={media[0].type === "image" ? () => openLightbox(lightboxIndexByPosition[0]) : undefined}
              />
              <PostMediaItem
                media={media[1]}
                className="w-full h-full col-span-3"
                onClick={media[1].type === "image" ? () => openLightbox(lightboxIndexByPosition[1]) : undefined}
              />
              {media.slice(2).map((m, idx) => (
                <PostMediaItem
                  key={idx + 2}
                  media={m}
                  className="w-full h-full col-span-2"
                  onClick={m.type === "image" ? () => openLightbox(lightboxIndexByPosition[idx + 2]) : undefined}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Media count badge for multiple items */}
      {media.length > 1 && (
        <div className="px-4 pt-2">
          <Badge variant="secondary" className="text-xs">
            {media.length} Medien
          </Badge>
        </div>
      )}

      {/* Post Content */}
      {post.content && (
        <div className={cn("p-4", media.length > 1 ? "pt-2" : "pt-3")}>
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={imageOnlyUrls}
        initialIndex={lightboxIndex}
        content={post.content}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default PostCard;
