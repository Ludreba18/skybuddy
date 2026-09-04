import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DateFilter {
  type: "single" | "range";
  date?: Date;
  from?: Date;
  to?: Date;
}

interface LocationFilter {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface EventFilters {
  searchQuery?: string;
  eventType?: string;
  sortBy?: string;
  dateFilter?: DateFilter;
  locationFilter?: LocationFilter;
}

// Haversine formula to calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useEvents = (filters: EventFilters = {}) => {
  const { searchQuery, eventType, sortBy = "date_asc", dateFilter, locationFilter } = filters;

  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          *,
          participants:event_participants (count),
          participant_profiles:event_participants (
            profile_id
          )
        `)
        .eq("is_public", true);

      // Apply date filter
      if (dateFilter) {
        if (dateFilter.type === "single" && dateFilter.date) {
          const startOfDay = new Date(dateFilter.date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(dateFilter.date);
          endOfDay.setHours(23, 59, 59, 999);
          query = query
            .gte("event_date", startOfDay.toISOString())
            .lte("event_date", endOfDay.toISOString());
        } else if (dateFilter.type === "range" && dateFilter.from) {
          const startDate = new Date(dateFilter.from);
          startDate.setHours(0, 0, 0, 0);
          query = query.gte("event_date", startDate.toISOString());
          
          if (dateFilter.to) {
            const endDate = new Date(dateFilter.to);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte("event_date", endDate.toISOString());
          }
        }
      } else {
        // Default: only future events
        query = query.gte("event_date", new Date().toISOString());
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,airport_name.ilike.%${searchQuery}%`);
      }

      // Apply event type filter based on tab
      if (eventType === "flyout") {
        query = query.eq("event_type", "flyout");
      } else if (eventType === "events_only") {
        query = query.in("event_type", ["fly_in", "stammtisch"]);
      }

      // Apply sorting
      if (sortBy === "date_asc") {
        query = query.order("event_date", { ascending: true });
      } else if (sortBy === "date_desc") {
        query = query.order("event_date", { ascending: false });
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Collect all profile IDs (organizers + participants)
      const organizerIds = data?.map(e => e.organizer_id).filter(Boolean) || [];
      const participantIds = data?.flatMap(e => 
        e.participant_profiles?.map((p: any) => p.profile_id) || []
      ) || [];
      const allProfileIds = [...new Set([...organizerIds, ...participantIds])];

      // Fetch profiles from public_profiles view
      let profileMap = new Map<string, any>();
      if (allProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("id, first_name, last_name, nickname, avatar_url")
          .in("id", allProfileIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      // Transform data to include participants count and merged profiles
      let events = data?.map((event) => ({
        ...event,
        organizer: profileMap.get(event.organizer_id) || null,
        participants_count: event.participants?.[0]?.count || 0,
        participant_profiles: event.participant_profiles?.map((p: any) => ({
          profile_id: p.profile_id,
          profile: profileMap.get(p.profile_id) || null
        }))
      })) || [];

      // Apply location filter client-side (since we need to calculate distances)
      if (locationFilter && locationFilter.latitude && locationFilter.longitude) {
        events = events.filter((event) => {
          if (!event.latitude || !event.longitude) return false;
          const distance = calculateDistance(
            locationFilter.latitude,
            locationFilter.longitude,
            event.latitude,
            event.longitude
          );
          return distance <= locationFilter.radius;
        });
      }

      return events;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useMyEvents = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["my-events", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      // Get events where user is participant
      const { data: participantEvents, error: participantError } = await supabase
        .from("event_participants")
        .select(`
          event:events (
            *,
            participants:event_participants (count),
            participant_profiles:event_participants (
              profile_id
            )
          )
        `)
        .eq("profile_id", profileId);

      if (participantError) throw participantError;

      // Get events where user is organizer
      const { data: organizerEvents, error: organizerError } = await supabase
        .from("events")
        .select(`
          *,
          participants:event_participants (count),
          participant_profiles:event_participants (
            profile_id
          )
        `)
        .eq("organizer_id", profileId)
        .gte("event_date", new Date().toISOString());

      if (organizerError) throw organizerError;

      // Combine and deduplicate
      const participantEventsList = participantEvents
        ?.map((p) => p.event)
        .filter((e): e is NonNullable<typeof e> => e !== null) || [];

      const allEvents = [...participantEventsList, ...(organizerEvents || [])];
      
      // Deduplicate by id
      const uniqueEventsMap = new Map<string, any>();
      allEvents.forEach(event => {
        if (!uniqueEventsMap.has(event.id)) {
          uniqueEventsMap.set(event.id, event);
        }
      });
      const uniqueEvents = Array.from(uniqueEventsMap.values());

      // Collect all profile IDs
      const organizerIds = uniqueEvents.map(e => e.organizer_id).filter(Boolean);
      const participantIds = uniqueEvents.flatMap(e => 
        e.participant_profiles?.map((p: any) => p.profile_id) || []
      );
      const allProfileIds = [...new Set([...organizerIds, ...participantIds])];

      // Fetch profiles from public_profiles view
      let profileMap = new Map<string, any>();
      if (allProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("id, first_name, last_name, nickname, avatar_url")
          .in("id", allProfileIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      // Transform events with merged profiles
      const eventsWithProfiles = uniqueEvents.map(event => ({
        ...event,
        organizer: profileMap.get(event.organizer_id) || null,
        participants_count: event.participants?.[0]?.count || 0,
        participant_profiles: event.participant_profiles?.map((p: any) => ({
          profile_id: p.profile_id,
          profile: profileMap.get(p.profile_id) || null
        }))
      }));

      // Sort by date
      return eventsWithProfiles.sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
    },
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useJoinEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, profileId }: { eventId: string; profileId: string }) => {
      const { error } = await supabase.from("event_participants").insert({
        event_id: eventId,
        profile_id: profileId,
        status: "attending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      toast({
        title: "Erfolgreich angemeldet!",
        description: "Du nimmst jetzt am Event teil.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Anmeldung fehlgeschlagen.",
        variant: "destructive",
      });
    },
  });
};

export const useLeaveEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, profileId }: { eventId: string; profileId: string }) => {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      toast({
        title: "Abgemeldet",
        description: "Du hast das Event verlassen.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Abmeldung fehlgeschlagen.",
        variant: "destructive",
      });
    },
  });
};