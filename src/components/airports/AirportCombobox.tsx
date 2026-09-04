import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAirports, useAirportByIcao, type Airport } from "@/hooks/useAirports";

interface AirportComboboxProps {
  value?: string; // ICAO code
  onSelect: (airport: { icao: string; name: string; lat?: number; lon?: number } | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const AirportCombobox = ({
  value,
  onSelect,
  placeholder = "Flugplatz auswählen...",
  className,
  disabled = false,
}: AirportComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch airports based on search
  const { data: airports, isLoading } = useAirports({
    searchQuery: searchQuery.length >= 2 ? searchQuery : undefined,
  });
  
  // Fetch the currently selected airport by ICAO
  const { data: selectedAirport } = useAirportByIcao(value);

  // Get display label
  const displayLabel = useMemo(() => {
    if (selectedAirport) {
      return `${selectedAirport.name} (${selectedAirport.icao_code})`;
    }
    if (value) {
      return value; // Show ICAO code while loading
    }
    return placeholder;
  }, [selectedAirport, value, placeholder]);

  // Group airports by country
  const groupedAirports = useMemo(() => {
    if (!airports) return {};
    
    return airports.reduce((acc, airport) => {
      const country = airport.country || "Unbekannt";
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(airport);
      return acc;
    }, {} as Record<string, Airport[]>);
  }, [airports]);

  const handleSelect = (airport: Airport) => {
    onSelect({
      icao: airport.icao_code,
      name: airport.name,
      lat: airport.latitude || undefined,
      lon: airport.longitude || undefined,
    });
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Suche nach Name oder ICAO..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Lade Flugplätze...</span>
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Mindestens 2 Zeichen eingeben...
              </div>
            ) : Object.keys(groupedAirports).length === 0 ? (
              <CommandEmpty>Kein Flugplatz gefunden.</CommandEmpty>
            ) : (
              Object.entries(groupedAirports).map(([country, countryAirports]) => (
                <CommandGroup key={country} heading={country}>
                  {countryAirports.map((airport) => (
                    <CommandItem
                      key={airport.id}
                      value={airport.icao_code}
                      onSelect={() => handleSelect(airport)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === airport.icao_code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {airport.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {airport.icao_code}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
        {value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full text-muted-foreground"
            >
              Auswahl entfernen
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AirportCombobox;
