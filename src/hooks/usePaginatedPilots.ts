import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PilotProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  flight_hours: number | null;
  home_airport_name: string | null;
  home_airport_icao: string | null;
  bio?: string | null;
  location?: string | null;
}

interface PilotLicense {
  profile_id: string;
  license_type: string;
}

interface PilotInterest {
  profile_id: string;
  interest: string;
}

interface PilotFilters {
  searchQuery: string;
  airportFilter: string;
  flightHoursFilter: string;
  selectedLicenses: string[];
  selectedInterests: string[];
}

const PILOTS_PER_PAGE = 24;

export function usePaginatedPilots(filters: PilotFilters) {
  const [page, setPage] = useState(0);
  const { searchQuery, airportFilter, flightHoursFilter, selectedLicenses, selectedInterests } = filters;

  // Reset page when filters change
  const resetPage = useCallback(() => setPage(0), []);

  // Main pilots query with server-side pagination and filtering
  const { data: pilotsData, isLoading, isFetching } = useQuery({
    queryKey: [
      "pilots-paginated",
      page,
      searchQuery,
      airportFilter,
      flightHoursFilter,
      selectedLicenses,
      selectedInterests,
    ],
    queryFn: async () => {
      const from = page * PILOTS_PER_PAGE;
      const to = from + PILOTS_PER_PAGE - 1;

      let query = supabase
        .from("public_profiles")
        .select(
          "id, first_name, last_name, nickname, avatar_url, flight_hours, home_airport_name, home_airport_icao, bio, location",
          { count: "exact" }
        )
        // Exclude deleted/anonymized users
        .neq("first_name", "Gelöschter");

      // Apply search filter (server-side)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        query = query.or(
          `first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,nickname.ilike.%${searchLower}%,home_airport_icao.ilike.%${searchLower}%,home_airport_name.ilike.%${searchLower}%`
        );
      }

      // Apply airport filter (server-side)
      if (airportFilter) {
        query = query.ilike("home_airport_icao", airportFilter);
      }

      // Apply flight hours filter (server-side)
      if (flightHoursFilter !== "all") {
        switch (flightHoursFilter) {
          case "0-100":
            query = query.lte("flight_hours", 100);
            break;
          case "100-300":
            query = query.gt("flight_hours", 100).lte("flight_hours", 300);
            break;
          case "300-500":
            query = query.gt("flight_hours", 300).lte("flight_hours", 500);
            break;
          case "500+":
            query = query.gt("flight_hours", 500);
            break;
        }
      }

      // Order and paginate
      query = query.order("created_at", { ascending: false }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        pilots: data as PilotProfile[],
        totalCount: count ?? 0,
      };
    },
    placeholderData: (prev) => prev, // Keep previous data while loading
  });

  // Fetch all licenses (needed for filtering and display)
  const { data: allLicenses } = useQuery({
    queryKey: ["pilot-licenses-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pilot_licenses")
        .select("profile_id, license_type");
      if (error) throw error;
      return data as PilotLicense[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch all interests (needed for filtering and display)
  const { data: allInterests } = useQuery({
    queryKey: ["pilot-interests-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pilot_interests")
        .select("profile_id, interest");
      if (error) throw error;
      return data as PilotInterest[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Create maps for quick lookup
  const licensesByPilot = useMemo(() => {
    const map: Record<string, string[]> = {};
    allLicenses?.forEach((l) => {
      if (!map[l.profile_id]) map[l.profile_id] = [];
      map[l.profile_id].push(l.license_type);
    });
    return map;
  }, [allLicenses]);

  const interestsByPilot = useMemo(() => {
    const map: Record<string, string[]> = {};
    allInterests?.forEach((i) => {
      if (!map[i.profile_id]) map[i.profile_id] = [];
      map[i.profile_id].push(i.interest);
    });
    return map;
  }, [allInterests]);

  // Client-side filtering for licenses and interests (these need JOIN logic)
  const filteredPilots = useMemo(() => {
    if (!pilotsData?.pilots) return [];

    return pilotsData.pilots.filter((pilot) => {
      // License filter (client-side as it requires JOIN)
      const pilotLicenses = licensesByPilot[pilot.id] || [];
      const matchesLicenses =
        selectedLicenses.length === 0 ||
        selectedLicenses.some((lic) => pilotLicenses.includes(lic));

      // Interest filter (client-side as it requires JOIN)
      const pilotInterests = interestsByPilot[pilot.id] || [];
      const matchesInterests =
        selectedInterests.length === 0 ||
        selectedInterests.some((int) => pilotInterests.includes(int));

      return matchesLicenses && matchesInterests;
    });
  }, [pilotsData?.pilots, selectedLicenses, selectedInterests, licensesByPilot, interestsByPilot]);

  const totalCount = pilotsData?.totalCount ?? 0;
  const hasNextPage = (page + 1) * PILOTS_PER_PAGE < totalCount;
  const hasPreviousPage = page > 0;
  const totalPages = Math.ceil(totalCount / PILOTS_PER_PAGE);

  const loadNextPage = useCallback(() => {
    if (hasNextPage) setPage((p) => p + 1);
  }, [hasNextPage]);

  const loadPreviousPage = useCallback(() => {
    if (hasPreviousPage) setPage((p) => p - 1);
  }, [hasPreviousPage]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 0 && newPage < totalPages) {
        setPage(newPage);
      }
    },
    [totalPages]
  );

  return {
    pilots: filteredPilots,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isFetching,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    resetPage,
    licensesByPilot,
    interestsByPilot,
    pageSize: PILOTS_PER_PAGE,
  };
}
