import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForumCategories, useCreateForumPost, useUpdateForumPost, ForumPost } from "@/hooks/useForum";
import { MentionTextarea } from "./MentionTextarea";
import { ImageUploadButton } from "./ImageUploadButton";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
  editPost?: ForumPost | null;
}

export function CreatePostDialog({ open, onClose, defaultCategoryId, editPost }: CreatePostDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: categories = [] } = useForumCategories();
  const createPost = useCreateForumPost();
  const updatePost = useUpdateForumPost();

  const isEditing = !!editPost;

  // Populate form when editing
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setContent(editPost.content);
      setCategoryId(editPost.category_id);
      setImageUrl(editPost.image_url || null);
    } else {
      setTitle("");
      setContent("");
      setCategoryId(defaultCategoryId || "");
      setImageUrl(null);
    }
  }, [editPost, defaultCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error("Bitte fülle alle Felder aus");
      return;
    }

    try {
      if (isEditing) {
        await updatePost.mutateAsync({
          postId: editPost.id,
          title: title.trim(),
          content: content.trim(),
          imageUrl,
        });
        toast.success("Beitrag aktualisiert!");
      } else {
        await createPost.mutateAsync({
          title: title.trim(),
          content: content.trim(),
          categoryId,
          imageUrl: imageUrl || undefined,
        });
        toast.success("Beitrag erstellt!");
      }
      
      setTitle("");
      setContent("");
      setCategoryId(defaultCategoryId || "");
      setImageUrl(null);
      onClose();
    } catch (error) {
      toast.error(isEditing ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen des Beitrags");
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setCategoryId(defaultCategoryId || "");
    setImageUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Beitrag bearbeiten" : "Neuen Beitrag erstellen"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle eine Kategorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gib deinem Beitrag einen Titel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt</Label>
            <p className="text-xs text-muted-foreground">Nutze @Name um andere Piloten zu erwähnen</p>
            <MentionTextarea
              value={content}
              onChange={setContent}
              placeholder="Was möchtest du teilen?"
              minHeight="150px"
            />
          </div>

          <div className="space-y-2">
            <Label>Bild (optional)</Label>
            <ImageUploadButton imageUrl={imageUrl} onImageChange={setImageUrl} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
              {(createPost.isPending || updatePost.isPending) 
                ? "Wird gespeichert..." 
                : isEditing ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
