import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 Minuten - Daten gelten als frisch
      gcTime: 30 * 60 * 1000, // 30 Minuten - Cache-Speicherzeit
      refetchOnWindowFocus: false, // Kein automatisches Refetch bei Tab-Wechsel
      retry: 2, // 2 Wiederholungsversuche bei Fehlern
      refetchOnMount: false, // Kein Refetch wenn Komponente mounted und Daten frisch
    },
    mutations: {
      retry: 1,
    },
  },
});
