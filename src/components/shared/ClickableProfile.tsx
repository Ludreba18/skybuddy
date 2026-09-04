import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PilotDetailSheet } from "@/components/pilots/PilotDetailSheet";
import { cn } from "@/lib/utils";

interface ProfileData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  flight_hours?: number | null;
  home_airport_name?: string | null;
  home_airport_icao?: string | null;
  membership_tier?: "free" | "premium";
  bio?: string | null;
  location?: string | null;
}

interface ClickableProfileProps {
  profile: ProfileData;
  showAvatar?: boolean;
  showName?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  nameClassName?: string;
  className?: string;
  children?: React.ReactNode;
}

const avatarSizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

export function ClickableProfile({
  profile,
  showAvatar = true,
  showName = true,
  avatarSize = "md",
  nameClassName,
  className,
  children,
}: ClickableProfileProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const displayName =
    profile.nickname ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Unbekannt";

  const initials = displayName.slice(0, 2).toUpperCase();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSheetOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer",
          className
        )}
      >
        {children ? (
          children
        ) : (
          <>
            {showAvatar && (
              <Avatar className={avatarSizes[avatarSize]}>
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className={cn("bg-primary/10 text-primary", textSizes[avatarSize])}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
            {showName && (
              <span
                className={cn(
                  "font-medium hover:text-primary transition-colors",
                  textSizes[avatarSize],
                  nameClassName
                )}
              >
                {displayName}
              </span>
            )}
          </>
        )}
      </button>

      <PilotDetailSheet
        pilot={{
          id: profile.id,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          nickname: profile.nickname || null,
          avatar_url: profile.avatar_url || null,
          flight_hours: profile.flight_hours || null,
          home_airport_name: profile.home_airport_name || null,
          home_airport_icao: profile.home_airport_icao || null,
          bio: profile.bio || null,
          location: profile.location || null,
        }}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
