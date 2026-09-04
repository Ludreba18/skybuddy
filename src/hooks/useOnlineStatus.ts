import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Update last_seen_at every 2 minutes while user is active
const UPDATE_INTERVAL = 2 * 60 * 1000;

export const useUpdateOnlineStatus = (profileId: string | undefined) => {
  useEffect(() => {
    if (!profileId) return;

    const updateLastSeen = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", profileId);
      } catch (error) {
        console.error("Error updating last_seen_at:", error);
      }
    };

    // Update immediately on mount
    updateLastSeen();

    // Update periodically
    const interval = setInterval(updateLastSeen, UPDATE_INTERVAL);

    // Update on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateLastSeen();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [profileId]);
};

// Check if a user was online in the last 5 minutes
export const isRecentlyOnline = (lastSeenAt: string | null): boolean => {
  if (!lastSeenAt) return false;
  const lastSeen = new Date(lastSeenAt);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastSeen > fiveMinutesAgo;
};
