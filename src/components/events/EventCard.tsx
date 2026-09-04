import { Calendar, MapPin, Users, Plane, Pencil, Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export interface EventData {
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

interface EventCardProps {
  event: EventData;
  onJoin?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  onRefresh?: () => void;
  isPremium?: boolean;
  currentProfileId?: string;
  onClick?: () => void;
}

const eventTypeLabels: Record<string, { label: string; color: string }> = {
  flyout: { label: "Fly-Out", color: "bg-primary text-primary-foreground" },
  fly_in: { label: "Event", color: "bg-secondary text-secondary-foreground" },
  stammtisch: { label: "Stammtisch", color: "bg-accent text-accent-foreground" },
};

const EventCard = ({ event, onJoin, onLeave, onRefresh, isPremium, currentProfileId, onClick }: EventCardProps) => {
  const eventDate = new Date(event.event_date);
  const typeConfig = eventTypeLabels[event.event_type];
  const organizerName = event.organizer?.nickname || 
    `${event.organizer?.first_name || ""} ${event.organizer?.last_name || ""}`.trim() || 
    "Unbekannt";
  const organizerInitials = organizerName.slice(0, 2).toUpperCase();
  
  const isOrganizer = currentProfileId && event.organizer?.id === currentProfileId;
  const participants = event.participant_profiles || [];
  const displayParticipants = participants.slice(0, 5);
  const remainingCount = participants.length - 5;
  const isParticipant = currentProfileId && participants.some(
    (p) => p.profile_id === currentProfileId
  );

  const getParticipantName = (p: Participant) => {
    if (!p.profile) return "Unbekannt";
    return p.profile.nickname || 
      `${p.profile.first_name || ""} ${p.profile.last_name || ""}`.trim() || 
      "Unbekannt";
  };

  const getParticipantInitials = (p: Participant) => {
    const name = getParticipantName(p);
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onClick={onClick}
    >
      {/* Event Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Plane className="w-16 h-16 text-primary/30" />
          </div>
        )}
        <Badge className={`absolute top-3 left-3 ${typeConfig.color}`}>
          {typeConfig.label}
        </Badge>
        
        {/* Edit button for organizer */}
        {isOrganizer && onRefresh && (
          <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
            <EventFormDialog
              profileId={currentProfileId}
              onEventSaved={onRefresh}
              event={event}
              trigger={
                <Button size="icon" variant="secondary" className="h-8 w-8">
                  <Pencil className="w-4 h-4" />
                </Button>
              }
            />
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <h3 className="font-heading font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium">
            {format(eventDate, "EEEE, d. MMMM yyyy", { locale: de })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="ml-6">{format(eventDate, "HH:mm")} Uhr</span>
        </div>

        {/* Location */}
        {(event.airport_name || event.airport_icao) && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-accent" />
            <span>
              {event.airport_name}
              {event.airport_icao && (
                <span className="text-muted-foreground ml-1">({event.airport_icao})</span>
              )}
            </span>
          </div>
        )}

        {/* Participants count */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-secondary" />
          <span>
            {event.participants_count || 0} / {event.max_participants || "∞"} Teilnehmer
          </span>
        </div>

        {/* Participant Avatars */}
        {participants.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <TooltipProvider>
              <div className="flex -space-x-2">
                {displayParticipants.map((participant) => (
                  participant.profile?.id ? (
                    <Tooltip key={participant.profile_id}>
                      <TooltipTrigger asChild>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ClickableProfile
                            profile={{
                              id: participant.profile.id,
                              first_name: participant.profile.first_name,
                              last_name: participant.profile.last_name,
                              nickname: participant.profile.nickname,
                              avatar_url: participant.profile.avatar_url,
                            }}
                            showName={false}
                            avatarSize="sm"
                          >
                            <Avatar className="w-7 h-7 border-2 border-card cursor-pointer hover:z-10 transition-transform hover:scale-110">
                              <AvatarImage src={participant.profile.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getParticipantInitials(participant)}
                              </AvatarFallback>
                            </Avatar>
                          </ClickableProfile>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getParticipantName(participant)}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip key={participant.profile_id}>
                      <TooltipTrigger asChild>
                        <Avatar className="w-7 h-7 border-2 border-card">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getParticipantInitials(participant)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getParticipantName(participant)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                ))}
                {remainingCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-7 h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center cursor-pointer">
                        <span className="text-xs font-medium text-muted-foreground">+{remainingCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{remainingCount} weitere Teilnehmer</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* Organizer */}
        <div className="flex items-center gap-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
          {event.organizer?.id ? (
            <ClickableProfile
              profile={{
                id: event.organizer.id,
                first_name: event.organizer.first_name,
                last_name: event.organizer.last_name,
                nickname: event.organizer.nickname,
                avatar_url: event.organizer.avatar_url,
              }}
              avatarSize="sm"
              className="text-sm text-muted-foreground"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={event.organizer.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {organizerInitials}
                </AvatarFallback>
              </Avatar>
              <span>von <span className="font-medium text-foreground">{organizerName}</span></span>
            </ClickableProfile>
          ) : (
            <>
              <Avatar className="w-6 h-6">
                <AvatarImage src={event.organizer?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {organizerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                von <span className="font-medium text-foreground">{organizerName}</span>
              </span>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {isPremium ? (
          isParticipant ? (
            <Button 
              variant="secondary"
              className="w-full" 
              onClick={(e) => {
                e.stopPropagation();
                onLeave?.(event.id);
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Du nimmst teil
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.(event.id);
              }}
            >
              Teilnehmen
            </Button>
          )
        ) : (
          <Button variant="outline" className="w-full" disabled onClick={(e) => e.stopPropagation()}>
            Premium erforderlich
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;