import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Contact {
  id: string;
  profileId: string;
  name: string;
  avatarUrl: string | null;
  homeAirport: string | null;
  flightHours: number | null;
  bio?: string | null;
  location?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  lastSeenAt?: string | null;
}

// Fetch contacts for the current user
export const useContacts = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["contacts", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      // 1. Fetch contacts (IDs only)
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id, contact_profile_id, created_at")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) return [];

      // 2. Get unique profile IDs
      const contactProfileIds = contacts.map(c => c.contact_profile_id);

      // 3. Fetch profile data from public_profiles (publicly accessible)
      const { data: profiles, error: profilesError } = await supabase
        .from("public_profiles")
        .select(`
          id,
          first_name,
          last_name,
          nickname,
          avatar_url,
          home_airport_icao,
          home_airport_name,
          flight_hours,
          bio,
          location,
          last_seen_at
        `)
        .in("id", contactProfileIds);

      if (profilesError) throw profilesError;

      // 4. Create profile map and merge
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return contacts.map((contact) => {
        const profile = profileMap.get(contact.contact_profile_id);
        return {
          id: contact.id,
          profileId: contact.contact_profile_id,
          name: profile?.nickname || 
            [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || 
            "Unbekannt",
          avatarUrl: profile?.avatar_url || null,
          homeAirport: profile?.home_airport_icao || null,
          flightHours: profile?.flight_hours || null,
          bio: profile?.bio || null,
          location: profile?.location || null,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          nickname: profile?.nickname || null,
          home_airport_name: profile?.home_airport_name || null,
          lastSeenAt: profile?.last_seen_at || null,
        };
      }) as Contact[];
    },
    enabled: !!profileId,
  });
};

// Check if a pilot is already a contact
export const useIsContact = (profileId: string | undefined, contactProfileId: string | undefined) => {
  return useQuery({
    queryKey: ["isContact", profileId, contactProfileId],
    queryFn: async () => {
      if (!profileId || !contactProfileId) return false;

      const { data, error } = await supabase
        .from("contacts")
        .select("id")
        .eq("profile_id", profileId)
        .eq("contact_profile_id", contactProfileId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!profileId && !!contactProfileId,
  });
};

// Add a contact
export const useAddContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, contactProfileId }: { profileId: string; contactProfileId: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          profile_id: profileId,
          contact_profile_id: contactProfileId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["isContact", variables.profileId, variables.contactProfileId] });
    },
  });
};

// Remove a contact
export const useRemoveContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, contactProfileId }: { profileId: string; contactProfileId: string }) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("profile_id", profileId)
        .eq("contact_profile_id", contactProfileId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["isContact", variables.profileId, variables.contactProfileId] });
    },
  });
};
