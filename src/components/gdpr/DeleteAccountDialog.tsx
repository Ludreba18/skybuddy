import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteAccountDialogProps {
  userEmail?: string | null;
}

const DeleteAccountDialog = ({ userEmail }: DeleteAccountDialogProps) => {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const emailToConfirm = userEmail || user?.email || "";
  const isConfirmed = confirmEmail.toLowerCase() === emailToConfirm.toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed || !profile?.id) return;

    setIsDeleting(true);

    try {
      // Deletes the auth.users row for the current user. Every table that
      // references profiles already cascades (ON DELETE CASCADE / SET NULL),
      // so this one call cleans up posts, messages, contacts, etc. too - and,
      // unlike the old anonymize-in-place approach, actually frees up the
      // email address for a fresh registration.
      const { error: deleteError } = await supabase.rpc("delete_own_account");
      if (deleteError) throw deleteError;

      await signOut();

      toast({
        title: "Konto gelöscht",
        description: "Dein Konto und alle zugehörigen Daten wurden gelöscht.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Fehler",
        description: "Beim Löschen deines Kontos ist ein Fehler aufgetreten. Bitte kontaktiere den Support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="w-4 h-4" />
          Konto löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Konto unwiderruflich löschen?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Diese Aktion kann <strong>nicht rückgängig gemacht werden</strong>. 
              Folgende Daten werden dauerhaft gelöscht:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Dein Profil und alle persönlichen Daten</li>
              <li>Alle deine Beiträge und Kommentare</li>
              <li>Deine Nachrichten und Kontakte</li>
              <li>Deine Events und Teilnahmen</li>
              <li>Alle hochgeladenen Bilder</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4">
          <Label htmlFor="confirm-email" className="text-sm font-medium">
            Gib deine E-Mail-Adresse ein, um zu bestätigen:
          </Label>
          <Input
            id="confirm-email"
            type="email"
            placeholder={emailToConfirm}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className="mt-2"
          />
          {confirmEmail && !isConfirmed && (
            <p className="text-sm text-destructive mt-1">
              Die E-Mail-Adresse stimmt nicht überein.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird gelöscht...
              </>
            ) : (
              "Ja, Konto löschen"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
