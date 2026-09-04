import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Lock, Loader2, ImagePlus } from "lucide-react";
import { useCreateGroup, GroupVisibility } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/hooks/useImageCompression";
import { useToast } from "@/hooks/use-toast";

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createGroup = useCreateGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("public");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setDescription("");
    setVisibility("public");
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Name fehlt", description: "Bitte gib der Gruppe einen Namen.", variant: "destructive" });
      return;
    }
    if (!user) return;

    let avatarUrl: string | null = null;
    if (avatarFile) {
      setUploading(true);
      try {
        const compressed = await compressImage(avatarFile, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("group-images").upload(fileName, compressed);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("group-images").getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      } catch (error) {
        toast({ title: "Bild-Upload fehlgeschlagen", variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    createGroup.mutate(
      { name: name.trim(), description: description.trim(), visibility, avatarUrl },
      { onSuccess: handleClose }
    );
  };

  const isPending = createGroup.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Gruppe erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-name">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Kunstflug München" maxLength={80} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Beschreibung</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht's in dieser Gruppe?"
              className="resize-none"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Sichtbarkeit</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as GroupVisibility)} className="gap-2">
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="public" id="visibility-public" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Globe className="w-4 h-4" /> Öffentlich
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Für alle sichtbar in der Gruppenübersicht, Beitritt per Anfrage.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="private" id="visibility-private" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Lock className="w-4 h-4" /> Privat
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nicht öffentlich gelistet, Beitritt nur per Einladung.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Gruppe erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
