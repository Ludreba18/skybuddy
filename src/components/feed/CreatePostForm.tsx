import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/hooks/useImageCompression";
import { Image, Send, X, Loader2, User, Plus, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatePostFormProps {
  profileId: string;
  userId: string;
  avatarUrl?: string | null;
  isPremium: boolean;
  groupId?: string;
  placeholder?: string;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const CreatePostForm = ({ profileId, userId, avatarUrl, isPremium, groupId, placeholder }: CreatePostFormProps) => {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: "image" | "video" }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: async () => {
      // 1. Create the post first
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          profile_id: profileId,
          content: content.trim() || null,
          image_url: null, // We'll use post_images table instead
          group_id: groupId || null,
        })
        .select("id")
        .single();

      if (postError) throw postError;

      // 2. Upload all media and create post_images entries
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file, index) => {
          const isVideo = file.type.startsWith("video/");
          const fileToUpload = isVideo
            ? file
            : await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });

          const ext = isVideo ? (file.name.split(".").pop() || "mp4") : "jpg";
          const fileName = `${userId}/${post.id}/${index}_${Date.now()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(fileName, fileToUpload);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("post-images")
            .getPublicUrl(fileName);

          return {
            post_id: post.id,
            image_url: urlData.publicUrl,
            position: index,
            media_type: isVideo ? "video" : "image",
          };
        });

        const mediaRecords = await Promise.all(uploadPromises);

        // Insert all media records
        const { error: mediaError } = await supabase
          .from("post_images")
          .insert(mediaRecords);

        if (mediaError) throw mediaError;

        // Update the post with the first image URL for backwards compatibility
        const firstImage = mediaRecords.find((m) => m.media_type === "image");
        if (firstImage) {
          await supabase
            .from("posts")
            .update({ image_url: firstImage.image_url })
            .eq("id", post.id);
        }
      }

      return post;
    },
    onSuccess: () => {
      setContent("");
      setMediaFiles([]);
      // Clean up preview URLs
      mediaPreviews.forEach((m) => URL.revokeObjectURL(m.url));
      setMediaPreviews([]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (groupId) queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
      toast({
        title: "Gepostet!",
        description: "Dein Beitrag wurde veröffentlicht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Beitrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - mediaFiles.length;

    if (remaining <= 0) {
      toast({
        title: "Maximum erreicht",
        description: `Du kannst maximal ${MAX_IMAGES} Dateien hochladen.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: { url: string; type: "image" | "video" }[] = [];

    for (const file of files.slice(0, remaining)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        toast({
          title: "Ungültiger Dateityp",
          description: `"${file.name}" ist kein Bild oder Video.`,
          variant: "destructive",
        });
        continue;
      }

      if (isImage && file.size > MAX_FILE_SIZE) {
        toast({
          title: "Datei zu groß",
          description: `"${file.name}" ist größer als 5MB.`,
          variant: "destructive",
        });
        continue;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        toast({
          title: "Datei zu groß",
          description: `"${file.name}" ist größer als 50MB.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
      newPreviews.push({ url: URL.createObjectURL(file), type: isVideo ? "video" : "image" });
    }

    setMediaFiles((prev) => [...prev, ...validFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = (content.trim() || mediaFiles.length > 0) && !createPost.isPending;

  if (!isPremium) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl text-center">
        <p className="text-sm text-muted-foreground flex-1">
          Werde Premium, um Beiträge zu teilen und mit der Community zu interagieren.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder={placeholder || "Was planst du als nächstes zu fliegen?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] resize-none bg-muted/30 border-0 focus-visible:ring-1"
            maxLength={500}
          />

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative shrink-0 group">
                  {preview.type === "video" ? (
                    <video src={preview.url} className="h-20 w-20 rounded-lg object-cover" muted />
                  ) : (
                    <img
                      src={preview.url}
                      alt={`Vorschau ${index + 1}`}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}

              {/* Add more button */}
              {mediaFiles.length < MAX_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs mt-1">{mediaFiles.length}/{MAX_IMAGES}</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaFiles.length >= MAX_IMAGES}
                className={cn(
                  mediaFiles.length >= MAX_IMAGES && "opacity-50 cursor-not-allowed"
                )}
              >
                <Image className="w-4 h-4" />
                <Video className="w-4 h-4 -ml-1.5" />
                Medien
                {mediaFiles.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({mediaFiles.length}/{MAX_IMAGES})
                  </span>
                )}
              </Button>
            </div>
            <Button
              size="sm"
              disabled={!canSubmit}
              onClick={() => createPost.mutate()}
            >
              {createPost.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Posten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostForm;
