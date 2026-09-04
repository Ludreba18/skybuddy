import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FeedImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export function FeedImage({ src, alt = "", className, onClick }: FeedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Check if src is valid
  const isValidSrc = src && src.trim().length > 0;

  // Reset states when src changes
  useEffect(() => {
    setLoaded(false);
    setError(!isValidSrc);
  }, [src, isValidSrc]);

  return (
    <div className={cn("relative bg-muted overflow-hidden", className)}>
      {/* Skeleton loader - only when valid src and still loading */}
      {isValidSrc && !loaded && !error && (
        <Skeleton className="absolute inset-0 rounded-none" />
      )}
      
      {/* Error state - also when src is invalid */}
      {(!isValidSrc || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImageOff className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      
      {/* Image - only render when valid src */}
      {isValidSrc && !error && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            onClick && "cursor-pointer hover:opacity-95",
            !loaded && "opacity-0"
          )}
          onClick={onClick}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
