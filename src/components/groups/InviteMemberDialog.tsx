import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInviteToGroup } from "@/hooks/useGroups";

interface InviteMemberDialogProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

export function InviteMemberDialog({ groupId, open, onClose }: InviteMemberDialogProps) {
  const [search, setSearch] = useState("");
  const invite = useInviteToGroup();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["invite-search", groupId, search],
    enabled: search.trim().length >= 2,
    queryFn: async () => {
      // Exclude people already in the group.
      const { data: members } = await supabase.from("group_members").select("profile_id").eq("group_id", groupId);
      const memberIds = (members || []).map((m) => m.profile_id);

      const { data, error } = await supabase
        .from("public_profiles")
        .select("id, first_name, last_name, nickname, avatar_url")
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%`)
        .limit(10);
      if (error) throw error;
      return (data || []).filter((p) => !memberIds.includes(p.id));
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mitglied einladen</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Name oder Nickname suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && search.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Keine Piloten gefunden.</p>
          )}
          {results.map((person) => {
            const name = [person.first_name, person.last_name].filter(Boolean).join(" ") || person.nickname || "Pilot";
            return (
              <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {person.avatar_url ? (
                    <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-primary">{name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <span className="flex-1 text-sm font-medium truncate">{name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => invite.mutate({ groupId, profileId: person.id })}
                  disabled={invite.isPending}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Einladen
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
