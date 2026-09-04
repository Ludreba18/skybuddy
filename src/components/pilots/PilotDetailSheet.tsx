import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Clock, 
  Award, 
  Heart, 
  Plane, 
  UserPlus, 
  UserMinus, 
  MessageCircle, 
  Quote,
  Crown,
  Calendar
} from "lucide-react";
import { useStartConversation } from "@/hooks/useConversations";
import { useIsContact, useAddContact, useRemoveContact } from "@/hooks/useContacts";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PilotProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  cover_image_url?: string | null;
  flight_hours: number | null;
  home_airport_name: string | null;
  home_airport_icao: string | null;
  bio?: string | null;
  location?: string | null;
}

interface PilotLicense {
  license_type: string;
  obtained_at?: string | null;
}

interface PilotInterest {
  interest: string;
}

interface PilotDetailSheetProps {
  pilot: PilotProfile | null;
  licenses?: PilotLicense[];
  interests?: PilotInterest[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LICENSE_LABELS: Record<string, string> = {
  "UL": "UL",
  "PPL_A": "PPL(A)",
  "LAPL": "LAPL",
  "CPL": "CPL",
  "FI": "FI",
  "IR": "IR",
  "ATPL": "ATPL",
};


export function PilotDetailSheet({ pilot, licenses, interests, open, onOpenChange }: PilotDetailSheetProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { hasActiveAccess } = useAccessStatus();
  const startConversation = useStartConversation();
  const addContact = useAddContact();
  const removeContact = useRemoveContact();

  const { data: isContact = false } = useIsContact(
    profile?.id, 
    pilot?.id
  );

  // Fetch pilot data (licenses, interests, aircraft)
  const { data: realLicenses = [] } = useQuery({
    queryKey: ["pilot-licenses", pilot?.id],
    queryFn: async () => {
      if (!pilot?.id) return [];
      const { data } = await supabase
        .from("pilot_licenses")
        .select("license_type, obtained_at")
        .eq("profile_id", pilot.id);
      return data || [];
    },
    enabled: !!pilot?.id,
  });

  const { data: realInterests = [] } = useQuery({
    queryKey: ["pilot-interests", pilot?.id],
    queryFn: async () => {
      if (!pilot?.id) return [];
      const { data } = await supabase
        .from("pilot_interests")
        .select("interest")
        .eq("profile_id", pilot.id);
      return data || [];
    },
    enabled: !!pilot?.id,
  });

  const { data: realAircraft = [] } = useQuery({
    queryKey: ["pilot-aircraft", pilot?.id],
    queryFn: async () => {
      if (!pilot?.id) return [];
      const { data } = await supabase
        .from("pilot_aircraft")
        .select("aircraft_type")
        .eq("profile_id", pilot.id);
      return data?.map(a => a.aircraft_type) || [];
    },
    enabled: !!pilot?.id,
  });

  // Fetch cover image
  const { data: pilotFullData } = useQuery({
    queryKey: ["pilot-full", pilot?.id],
    queryFn: async () => {
      if (!pilot?.id) return null;
      const { data } = await supabase
        .from("public_profiles")
        .select("cover_image_url")
        .eq("id", pilot.id)
        .single();
      return data;
    },
    enabled: !!pilot?.id,
  });

  if (!pilot) return null;

  const displayName = pilot.nickname || 
    [pilot.first_name, pilot.last_name].filter(Boolean).join(" ") || 
    "Unbekannter Pilot";
  
  const fullName = [pilot.first_name, pilot.last_name].filter(Boolean).join(" ");
  const initials = displayName.slice(0, 2).toUpperCase();

  // Use real data
  const pilotLicenses = licenses || realLicenses;
  const pilotInterests = interests || realInterests;
  const pilotBio = pilot.bio;
  const pilotAircraft = realAircraft;
  const coverImageUrl = pilot.cover_image_url || pilotFullData?.cover_image_url;

  const isOwnProfile = profile?.id === pilot.id;

  const handleToggleContact = async () => {
    if (!profile) {
      toast.error("Bitte melde dich an");
      navigate("/auth");
      return;
    }

    try {
      if (isContact) {
        await removeContact.mutateAsync({ 
          profileId: profile.id, 
          contactProfileId: pilot.id 
        });
        toast.success("Kontakt entfernt");
      } else {
        await addContact.mutateAsync({ 
          profileId: profile.id, 
          contactProfileId: pilot.id 
        });
        toast.success("Kontakt hinzugefügt");
      }
    } catch (error) {
      console.error("Error toggling contact:", error);
      toast.error("Fehler beim Aktualisieren des Kontakts");
    }
  };

  const handleStartConversation = async () => {
    if (!profile) {
      toast.error("Bitte melde dich an");
      navigate("/auth");
      return;
    }

    if (!hasActiveAccess) {
      toast.error("Aktive Mitgliedschaft oder Testphase erforderlich");
      return;
    }

    try {
      const conversationId = await startConversation.mutateAsync(pilot.id);
      onOpenChange(false);
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Fehler beim Starten der Unterhaltung");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card max-h-[90vh]">
        <ScrollArea className="max-h-[90vh]">
          {/* Cover Image */}
          <div className="relative h-40 md:h-52 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/20">
            {coverImageUrl ? (
              <img 
                src={coverImageUrl} 
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>

          {/* Profile Header - Overlapping Avatar */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 relative z-10">
              {/* Avatar */}
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-card shadow-xl overflow-hidden bg-card shrink-0">
                {pilot.avatar_url ? (
                  <img 
                    src={pilot.avatar_url} 
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-4xl font-bold text-primary/40">{initials}</span>
                  </div>
                )}
              </div>

              {/* Name & Quick Info */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">{displayName}</h2>
                </div>
                {fullName && pilot.nickname && (
                  <p className="text-muted-foreground">{fullName}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                  {pilot.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {pilot.location}
                    </span>
                  )}
                  {pilot.home_airport_icao && (
                    <span className="flex items-center gap-1">
                      <Plane className="h-4 w-4" />
                      {pilot.home_airport_icao}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex gap-3 mt-6">
                <Button 
                  variant={isContact ? "secondary" : "outline"} 
                  className="flex-1"
                  onClick={handleToggleContact}
                  disabled={addContact.isPending || removeContact.isPending}
                >
                  {isContact ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Kontakt entfernen
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Als Kontakt hinzufügen
                    </>
                  )}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleStartConversation}
                  disabled={startConversation.isPending || !hasActiveAccess}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Nachricht senden
                </Button>
              </div>
            )}

            {/* Bio Section */}
            {pilotBio && (
              <div className="mt-6 bg-muted/30 rounded-xl p-5 relative">
                <Quote className="h-8 w-8 text-primary/20 absolute top-3 left-3" />
                <p className="text-foreground/90 leading-relaxed pl-8 pt-2 italic">
                  "{pilotBio}"
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-heading font-bold">{pilot.flight_hours || 0}h</p>
                <p className="text-xs text-muted-foreground">Flugstunden</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Award className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-heading font-bold">{pilotLicenses.length}</p>
                <p className="text-xs text-muted-foreground">Lizenzen</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Plane className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-heading font-bold">{pilotAircraft.length}</p>
                <p className="text-xs text-muted-foreground">Flugzeuge</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-heading font-bold">2024</p>
                <p className="text-xs text-muted-foreground">Dabei seit</p>
              </div>
            </div>

            {/* Licenses Section */}
            {pilotLicenses.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Lizenzen & Berechtigungen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pilotLicenses.map((license, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      <span className="font-medium">
                        {LICENSE_LABELS[license.license_type] || license.license_type}
                      </span>
                      {license.obtained_at && (
                        <span className="text-primary/70 text-sm">
                          seit {new Date(license.obtained_at).getFullYear()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aircraft Section */}
            {pilotAircraft.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary" />
                  Flugzeugtypen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pilotAircraft.map((aircraft, index) => (
                    <div 
                      key={index} 
                      className="bg-secondary/50 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Plane className="w-4 h-4 text-secondary-foreground/70" />
                      <span className="font-medium">{aircraft}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interests Section */}
            {pilotInterests.length > 0 && (
              <div className="mt-6 pb-2">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Interessen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pilotInterests.map((item, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1.5">
                      {item.interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
