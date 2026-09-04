import { Calendar, MapPin, Users, Plane, Pencil, LogOut, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import EventFormDialog from "./EventFormDialog";
import { ClickableProfile } from "@/components/shared/ClickableProfile";

interface Participant {
  profile_id: string;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: "flyout" | "fly_in" | "stammtisch";
  airport_name: string | null;
  airport_icao: string | null;
  max_participants: number | null;
  image_url: string | null;
  organizer?: {
    id?: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
  participants_count?: number;
  participant_profiles?: Participant[];
}

interface EventDetailDialogProps {
  event: EventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  onRefresh?: () => void;
  isPremium?: boolean;
  currentProfileId?: string;
}

const eventTypeLabels: Record<string, { label: string; color: string }> = {
  flyout: { label: "Fly-Out", color: "bg-primary text-primary-foreground" },
  fly_in: { label: "Event", color: "bg-secondary text-secondary-foreground" },
  stammtisch: { label: "Stammtisch", color: "bg-accent text-accent-foreground" },
};

const EventDetailDialog = ({
  event,
  open,
  onOpenChange,
  onJoin,
  onLeave,
  onRefresh,
  isPremium,
  currentProfileId,
}: EventDetailDialogProps) => {
  if (!event) return null;

  const eventDate = new Date(event.event_date);
  const typeConfig = eventTypeLabels[event.event_type];
  const organizerName =
    event.organizer?.nickname ||
    `${event.organizer?.first_name || ""} ${event.organizer?.last_name || ""}`.trim() ||
    "Unbekannt";
  const organizerInitials = organizerName.slice(0, 2).toUpperCase();

  const isOrganizer = currentProfileId && event.organizer?.id === currentProfileId;
  const participants = event.participant_profiles || [];
  
  // Check if current user is a participant
  const isParticipant = currentProfileId && participants.some(
    (p) => p.profile_id === currentProfileId
  );

  const getParticipantName = (p: Participant) => {
    if (!p.profile) return "Unbekannt";
    return (
      p.profile.nickname ||
      `${p.profile.first_name || ""} ${p.profile.last_name || ""}`.trim() ||
      "Unbekannt"
    );
  };

  const getParticipantInitials = (p: Participant) => {
    const name = getParticipantName(p);
    return name.slice(0, 2).toUpperCase();
  };

  const handleJoin = () => {
    onJoin?.(event.id);
    onOpenChange(false);
  };

  const handleLeave = () => {
    onLeave?.(event.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90vh] [&>button]:hidden">
        <ScrollArea className="max-h-[90vh]">
          {/* Hero Image */}
          <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Plane className="w-24 h-24 text-primary/30" />
              </div>
            )}
            <Badge className={`absolute top-4 left-4 ${typeConfig.color}`}>
              {typeConfig.label}
            </Badge>
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-background/80 hover:bg-background rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Header */}
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-2xl font-bold leading-tight">
                {event.title}
              </DialogTitle>
              
              {/* Organizer */}
              {event.organizer?.id ? (
                <ClickableProfile
                  profile={{
                    id: event.organizer.id,
                    first_name: event.organizer.first_name,
                    last_name: event.organizer.last_name,
                    nickname: event.organizer.nickname,
                    avatar_url: event.organizer.avatar_url,
                  }}
                  avatarSize="lg"
                  className="flex items-center gap-3"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={event.organizer.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {organizerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Organisiert von</p>
                    <p className="font-medium">{organizerName}</p>
                  </div>
                </ClickableProfile>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={event.organizer?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {organizerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Organisiert von</p>
                    <p className="font-medium">{organizerName}</p>
                  </div>
                </div>
              )}
            </DialogHeader>

            <Separator />

            {/* Event Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum & Uhrzeit</p>
                  <p className="font-medium">
                    {format(eventDate, "EEEE, d. MMMM yyyy", { locale: de })}
                  </p>
                  <p className="text-sm">{format(eventDate, "HH:mm")} Uhr</p>
                </div>
              </div>

              {(event.airport_name || event.airport_icao) && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ort</p>
                    <p className="font-medium">{event.airport_name}</p>
                    {event.airport_icao && (
                      <p className="text-sm text-muted-foreground">
                        {event.airport_icao}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teilnehmer</p>
                  <p className="font-medium">
                    {event.participants_count || 0} / {event.max_participants || "∞"}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Beschreibung</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    Teilnehmer ({participants.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((participant) => (
                      participant.profile?.id ? (
                        <ClickableProfile
                          key={participant.profile_id}
                          profile={{
                            id: participant.profile.id,
                            first_name: participant.profile.first_name,
                            last_name: participant.profile.last_name,
                            nickname: participant.profile.nickname,
                            avatar_url: participant.profile.avatar_url,
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted hover:bg-muted/80"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={participant.profile.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getParticipantInitials(participant)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {getParticipantName(participant)}
                          </span>
                        </ClickableProfile>
                      ) : (
                        <div
                          key={participant.profile_id}
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={participant.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getParticipantInitials(participant)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {getParticipantName(participant)}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isPremium ? (
                isParticipant ? (
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    onClick={handleLeave}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Verlassen
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={handleJoin}>
                    Teilnehmen
                  </Button>
                )
              ) : (
                <Button variant="outline" className="flex-1" disabled>
                  Premium erforderlich
                </Button>
              )}

              {isOrganizer && onRefresh && (
                <EventFormDialog
                  profileId={currentProfileId}
                  onEventSaved={() => {
                    onRefresh();
                    onOpenChange(false);
                  }}
                  event={event}
                  trigger={
                    <Button variant="outline" className="flex-1">
                      <Pencil className="w-4 h-4 mr-2" />
                      Bearbeiten
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
