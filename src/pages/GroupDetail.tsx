import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Globe, Lock, Users, UserPlus, LogOut, Check, X, Loader2, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/feed/PostCard";
import CreatePostForm from "@/components/feed/CreatePostForm";
import { InviteMemberDialog } from "@/components/groups/InviteMemberDialog";
import { GroupMembersDialog } from "@/components/groups/GroupMembersDialog";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import {
  useGroup,
  useGroupMembers,
  useMyMembership,
  usePendingJoinRequests,
  useGroupPosts,
  useRequestToJoinGroup,
  useRespondToJoinRequest,
  useLeaveGroup,
} from "@/hooks/useGroups";

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile, user } = useAuth();
  const { hasActiveAccess } = useAccessStatus();
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: myMembership } = useMyMembership(groupId);
  const { data: pendingRequests = [] } = usePendingJoinRequests(myMembership?.role === "admin" ? groupId : undefined);
  const { data: posts = [], isLoading: postsLoading } = useGroupPosts(groupId);

  const requestToJoin = useRequestToJoinGroup();
  const respondToRequest = useRespondToJoinRequest();
  const leaveGroup = useLeaveGroup();

  const isMember = !!myMembership;
  const isAdmin = myMembership?.role === "admin";

  if (groupLoading) {
    return (
      <DashboardLayout>
        <main className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full" />
        </main>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout>
        <main className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Gruppe nicht gefunden oder du hast keinen Zugriff.</p>
          <Link to="/groups" className="text-primary hover:underline text-sm mt-2 inline-block">
            Zurück zu Gruppen
          </Link>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Gruppen
        </Link>

        {/* Group header */}
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="h-28 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
            {group.cover_image_url && (
              <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-4 -mt-10 flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card overflow-hidden shrink-0 flex items-center justify-center bg-primary/10">
              {group.avatar_url ? (
                <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-bold text-xl text-primary">{group.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading">{group.name}</h1>
              {group.visibility === "private" ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
            <button
              type="button"
              onClick={() => setShowMembers(true)}
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground hover:underline w-fit"
            >
              <Users className="w-3.5 h-3.5" /> {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"}
            </button>

            <div className="flex gap-2 pt-2">
              {!isMember && group.visibility === "public" && (
                <Button
                  size="sm"
                  onClick={() => requestToJoin.mutate(group.id)}
                  disabled={requestToJoin.isPending || !hasActiveAccess}
                >
                  {requestToJoin.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Beitrittsanfrage stellen
                </Button>
              )}
              {isMember && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setShowInvite(true)}>
                    <UserPlus className="w-4 h-4" /> Einladen
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => leaveGroup.mutate(group.id)}
                    disabled={leaveGroup.isPending}
                  >
                    <LogOut className="w-4 h-4" /> Verlassen
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pending join requests (admin only) */}
        {isAdmin && pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Offene Beitrittsanfragen</h2>
            {pendingRequests.map((req) => {
              const name = [req.profile?.first_name, req.profile?.last_name].filter(Boolean).join(" ") || req.profile?.nickname || "Pilot";
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {req.profile?.avatar_url ? (
                      <img src={req.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-primary">{name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{name}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => respondToRequest.mutate({ requestId: req.id, accept: true })}
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => respondToRequest.mutate({ requestId: req.id, accept: false })}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Group posts */}
        <div className="space-y-4">
          {isMember && profile && user && (
            <div className="bg-card rounded-xl border border-border p-4">
              <CreatePostForm
                profileId={profile.id}
                userId={user.id}
                avatarUrl={profile.avatar_url}
                isPremium={hasActiveAccess}
                groupId={group.id}
                placeholder={`Teile etwas mit ${group.name}...`}
              />
            </div>
          )}

          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Noch keine Beiträge in dieser Gruppe.</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>

      {groupId && <InviteMemberDialog groupId={groupId} open={showInvite} onClose={() => setShowInvite(false)} />}
      {groupId && <GroupMembersDialog groupId={groupId} open={showMembers} onClose={() => setShowMembers(false)} />}
    </DashboardLayout>
  );
};

export default GroupDetail;
