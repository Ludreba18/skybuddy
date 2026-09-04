import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Airport {
  id: string;
  icao_code: string;
  name: string;
  country: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
}

interface UseAirportsOptions {
  countryFilter?: string[];
  searchQuery?: string;
}

export const useAirports = (options: UseAirportsOptions = {}) => {
  const { countryFilter, searchQuery } = options;

  return useQuery({
    queryKey: ["airports", countryFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("airports")
        .select("*")
        .order("name");

      if (countryFilter && countryFilter.length > 0) {
        query = query.in("country_code", countryFilter);
      }

      if (searchQuery && searchQuery.trim().length >= 2) {
        const search = searchQuery.trim().toUpperCase();
        // Search by ICAO code or name
        query = query.or(`icao_code.ilike.%${search}%,name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return data as Airport[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache - master data doesn't change often
  });
};

export const useAirportByIcao = (icaoCode: string | undefined) => {
  return useQuery({
    queryKey: ["airport", icaoCode],
    queryFn: async () => {
      if (!icaoCode) return null;
      
      const { data, error } = await supabase
        .from("airports")
        .select("*")
        .eq("icao_code", icaoCode.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      return data as Airport | null;
    },
    enabled: !!icaoCode && icaoCode.length >= 3,
    staleTime: 1000 * 60 * 60,
  });
};
