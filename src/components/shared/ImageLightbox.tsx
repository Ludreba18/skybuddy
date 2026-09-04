import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  content?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ 
  images, 
  initialIndex = 0, 
  content, 
  isOpen, 
  onClose 
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDistance, setTouchDistance] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Reset when dialog opens or image changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex, resetZoom]);

  // Reset zoom and loading state when changing images
  useEffect(() => {
    resetZoom();
    setImageLoading(true);
    setImageError(false);
  }, [currentIndex, resetZoom]);

  // Preload adjacent images for smoother navigation
  useEffect(() => {
    if (!isOpen || images.length <= 1) return;
    
    const preloadIndices = [
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length
    ];
    
    preloadIndices.forEach(idx => {
      const img = new Image();
      img.src = images[idx];
    });
  }, [currentIndex, images, isOpen]);

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1) {
      resetZoom();
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setScale(2.5);
        setPosition({ x: -x * 0.6, y: -y * 0.6 });
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for swipe and pinch zoom
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      setTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1 && scale === 1) {
      // Swipe start (only when not zoomed)
      setTouchStartX(e.touches[0].clientX);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan start when zoomed
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance !== null) {
      // Pinch zoom
      const newDistance = getTouchDistance(e.touches);
      if (newDistance !== null) {
        const delta = newDistance / touchDistance;
        setScale((prev) => Math.min(4, Math.max(1, prev * delta)));
        setTouchDistance(newDistance);
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan when zoomed
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Handle swipe for navigation (only when not zoomed)
    if (touchStartX !== null && scale === 1 && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    }
    
    setTouchDistance(null);
    setTouchStartX(null);
    setIsDragging(false);
    
    if (scale < 1.1) {
      resetZoom();
    }
  };

  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(4, prev + 0.5));
  };

  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale <= 1.5) {
      resetZoom();
    } else {
      setScale((prev) => Math.max(1, prev - 0.5));
    }
  };

  if (!images.length) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay 
          className="bg-black/90 backdrop-blur-sm"
          onClick={(e) => {
            if (scale === 1) {
              onClose();
            }
          }}
        />
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={zoomOut}
              disabled={scale <= 1}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm bg-black/50 px-2 py-1 rounded min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={zoomIn}
              disabled={scale >= 4}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 z-10 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 z-10 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image Container */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center w-full h-full max-h-[70vh] overflow-hidden pointer-events-auto"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Loading spinner */}
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div className="flex flex-col items-center justify-center text-white/60">
                <ImageOff className="w-16 h-16 mb-3" />
                <p className="text-sm">Bild konnte nicht geladen werden</p>
              </div>
            )}

            {/* Image */}
            {!imageError && (
              <img
                ref={imageRef}
                src={currentImage}
                alt=""
                className={cn(
                  "max-h-[70vh] max-w-full object-contain select-none transition-all duration-200",
                  imageLoading && "opacity-0"
                )}
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                }}
                onLoad={() => setImageLoading(false)}
                onError={() => { setImageLoading(false); setImageError(true); }}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                draggable={false}
              />
            )}
            
            {/* Zoom hint */}
            {scale === 1 && !imageLoading && !imageError && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/40 px-3 py-1 rounded-full">
                Doppelklick zum Zoomen
              </div>
            )}
          </div>

          {/* Dot Navigation */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 pointer-events-auto">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex 
                      ? "bg-white w-4" 
                      : "bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Bild ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Content */}
          {content && (
            <div className="mt-4 w-full max-w-2xl px-4 pointer-events-auto">
              <ScrollArea className="max-h-[15vh]">
                <p className="text-white/90 text-center">{content}</p>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogPortal>
    </Dialog>
  );
}
