import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadForumImage } from "@/hooks/useForum";
import { useAuth } from "@/hooks/useAuth";
import { compressImage } from "@/hooks/useImageCompression";
import { toast } from "sonner";

interface ImageUploadButtonProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function ImageUploadButton({ imageUrl, onImageChange }: ImageUploadButtonProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle ein Bild aus");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Das Bild darf maximal 5MB groß sein");
      return;
    }

    setUploading(true);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });
      
      const url = await uploadForumImage(compressedFile, user.id);
      onImageChange(url);
      toast.success("Bild hochgeladen!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      
      {imageUrl ? (
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt="Hochgeladenes Bild"
            className="max-h-40 rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              Bild hinzufügen
            </>
          )}
        </Button>
      )}
    </div>
  );
}
