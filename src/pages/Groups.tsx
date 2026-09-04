import { useState } from "react";
import { Users, Plus, Mail, Check, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { usePublicGroups, useMyGroups, useMyInvitations, useRespondToInvitation } from "@/hooks/useGroups";

const Groups = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: publicGroups = [], isLoading: publicLoading } = usePublicGroups();
  const { data: myGroups = [], isLoading: myLoading } = useMyGroups();
  const { data: invitations = [] } = useMyInvitations();
  const respondToInvitation = useRespondToInvitation();

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading">Gruppen</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Finde oder gründe deine Community</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Neue Gruppe</span>
          </Button>
        </div>

        {invitations.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Einladungen
            </h2>
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {inv.group?.avatar_url ? (
                    <img src={inv.group.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-primary" />
                  )}
                </div>
                <span className="flex-1 text-sm">
                  Du wurdest zu <strong>{inv.group?.name}</strong> eingeladen.
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => respondToInvitation.mutate({ invitationId: inv.id, accept: true })}
                >
                  <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => respondToInvitation.mutate({ invitationId: inv.id, accept: false })}
                >
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="public" className="space-y-4">
          <TabsList>
            <TabsTrigger value="public">Öffentliche Gruppen</TabsTrigger>
            <TabsTrigger value="mine">Meine Gruppen ({myGroups.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="space-y-3">
            {publicLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : publicGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Noch keine öffentlichen Gruppen.</p>
                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                  Gründe die erste Gruppe!
                </Button>
              </div>
            ) : (
              publicGroups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </TabsContent>

          <TabsContent value="mine" className="space-y-3">
            {myLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : myGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Du bist noch in keiner Gruppe.</p>
              </div>
            ) : (
              myGroups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </TabsContent>
        </Tabs>
      </main>

      <CreateGroupDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </DashboardLayout>
  );
};

export default Groups;
