import { Link } from "react-router-dom";
import { Users, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJoinRequestForConversation, useRespondToJoinRequest } from "@/hooks/useGroups";

interface JoinRequestBannerProps {
  conversationId: string;
  currentProfileId: string;
}

// Shown above a chat when it was started via a group join request, so the
// admin can accept/decline right here instead of having to find the group page.
export function JoinRequestBanner({ conversationId, currentProfileId }: JoinRequestBannerProps) {
  const { data: request } = useJoinRequestForConversation(conversationId);
  const respond = useRespondToJoinRequest();

  if (!request) return null;

  // Only show the accept/decline controls to the admin who needs to respond -
  // the requester just sees a neutral status line.
  const isRequester = request.profile_id === currentProfileId;
  const requesterName =
    [request.profile?.first_name, request.profile?.last_name].filter(Boolean).join(" ") ||
    request.profile?.nickname ||
    "Diese Person";

  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-primary/5 border-b">
      <Users className="h-4 w-4 text-primary shrink-0" />
      <p className="flex-1 text-sm">
        {isRequester ? (
          <>
            Deine Beitrittsanfrage für{" "}
            <Link to={`/groups/${request.group?.id}`} className="font-medium text-primary hover:underline">
              {request.group?.name}
            </Link>{" "}
            wartet auf Antwort.
          </>
        ) : (
          <>
            <span className="font-medium">{requesterName}</span> möchte der Gruppe{" "}
            <Link to={`/groups/${request.group?.id}`} className="font-medium text-primary hover:underline">
              {request.group?.name}
            </Link>{" "}
            beitreten.
          </>
        )}
      </p>
      {!isRequester && (
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => respond.mutate({ requestId: request.id, accept: true })}
            disabled={respond.isPending}
          >
            <Check className="h-3.5 w-3.5 text-green-600" /> Annehmen
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => respond.mutate({ requestId: request.id, accept: false })}
            disabled={respond.isPending}
          >
            <X className="h-3.5 w-3.5 text-destructive" /> Ablehnen
          </Button>
        </div>
      )}
    </div>
  );
}
