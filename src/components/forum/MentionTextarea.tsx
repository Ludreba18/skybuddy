import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfiles } from "@/hooks/useForum";
import { cn } from "@/lib/utils";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}

export function MentionTextarea({ 
  value, 
  onChange, 
  placeholder, 
  className,
  minHeight = "100px" 
}: MentionTextareaProps) {
  const { data: profiles = [] } = useProfiles();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const getDisplayName = (profile: Profile) => {
    return profile.nickname || 
      `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || 
      "Unbekannt";
  };

  const filteredProfiles = profiles.filter((profile) => {
    if (!suggestionFilter) return true;
    const name = getDisplayName(profile).toLowerCase();
    return name.includes(suggestionFilter.toLowerCase());
  }).slice(0, 5);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(newValue);
    setCursorPosition(cursor);

    // Check for @ mention
    const textBeforeCursor = newValue.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setSuggestionFilter(atMatch[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = useCallback((profile: Profile) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    const displayName = getDisplayName(profile);
    const newText = textBeforeCursor.slice(0, atIndex) + `@${displayName} ` + textAfterCursor;
    
    onChange(newText);
    setShowSuggestions(false);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = atIndex + displayName.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  }, [value, cursorPosition, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredProfiles.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredProfiles[selectedIndex]) {
      e.preventDefault();
      insertMention(filteredProfiles[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(className)}
        style={{ minHeight }}
      />
      
      {showSuggestions && filteredProfiles.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-64 mt-1 bg-popover border rounded-md shadow-lg overflow-hidden"
        >
          {filteredProfiles.map((profile, index) => {
            const displayName = getDisplayName(profile);
            const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

            return (
              <button
                key={profile.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors",
                  index === selectedIndex && "bg-muted"
                )}
                onClick={() => insertMention(profile)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{displayName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
