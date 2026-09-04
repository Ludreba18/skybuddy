import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldCheck } from "lucide-react";
import { useGroupMembers } from "@/hooks/useGroups";

interface GroupMembersDialogProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

export function GroupMembersDialog({ groupId, open, onClose }: GroupMembersDialogProps) {
  const { data: members = [], isLoading } = useGroupMembers(open ? groupId : undefined);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Noch keine Mitglieder.</p>
          )}
          {members.map((member) => {
            const name =
              [member.profile?.first_name, member.profile?.last_name].filter(Boolean).join(" ") ||
              member.profile?.nickname ||
              "Pilot";
            return (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-primary">{name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <span className="flex-1 text-sm font-medium truncate">{name}</span>
                {member.role === "admin" && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
