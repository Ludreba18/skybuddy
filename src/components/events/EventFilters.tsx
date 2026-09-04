import { useState } from "react";
import { Search, Calendar, MapPin, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";
import AirportCombobox from "@/components/airports/AirportCombobox";

export interface LocationFilter {
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in km
}

export interface DateFilter {
  type: "single" | "range";
  date?: Date;
  from?: Date;
  to?: Date;
}

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  dateFilter?: DateFilter;
  onDateFilterChange: (filter: DateFilter | undefined) => void;
  locationFilter?: LocationFilter;
  onLocationFilterChange: (filter: LocationFilter | undefined) => void;
}

const EventFilters = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  dateFilter,
  onDateFilterChange,
  locationFilter,
  onLocationFilterChange,
}: EventFiltersProps) => {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [selectedAirportIcao, setSelectedAirportIcao] = useState<string>("");
  const [radius, setRadius] = useState(50);
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pendingAirportData, setPendingAirportData] = useState<{ name: string; lat?: number; lon?: number } | null>(null);

  const applyLocationFilter = () => {
    if (pendingAirportData && pendingAirportData.lat && pendingAirportData.lon) {
      onLocationFilterChange({
        name: pendingAirportData.name,
        latitude: pendingAirportData.lat,
        longitude: pendingAirportData.lon,
        radius: radius,
      });
      setLocationPopoverOpen(false);
    }
  };

  const applyDateFilter = () => {
    if (dateMode === "single" && selectedDate) {
      onDateFilterChange({ type: "single", date: selectedDate });
    } else if (dateMode === "range" && dateRange?.from) {
      onDateFilterChange({ 
        type: "range", 
        from: dateRange.from, 
        to: dateRange.to 
      });
    }
    setDatePopoverOpen(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setDateRange(undefined);
    onDateFilterChange(undefined);
  };

  const clearLocationFilter = () => {
    setSelectedAirportIcao("");
    setPendingAirportData(null);
    onLocationFilterChange(undefined);
  };

  const getDateLabel = () => {
    if (!dateFilter) return "Datum";
    if (dateFilter.type === "single" && dateFilter.date) {
      return format(dateFilter.date, "dd.MM.yyyy", { locale: de });
    }
    if (dateFilter.type === "range" && dateFilter.from) {
      const fromStr = format(dateFilter.from, "dd.MM.", { locale: de });
      const toStr = dateFilter.to 
        ? format(dateFilter.to, "dd.MM.yyyy", { locale: de })
        : "...";
      return `${fromStr} - ${toStr}`;
    }
    return "Datum";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Ort, Titel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        {/* Date Filter */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full sm:w-auto justify-start gap-2 bg-card",
                dateFilter && "border-primary"
              )}
            >
              <Calendar className="w-4 h-4" />
              <span className="truncate max-w-[120px]">{getDateLabel()}</span>
              {dateFilter && (
                <span
                  role="button"
                  className="ml-auto p-1 -mr-1 rounded-full hover:bg-destructive/10 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearDateFilter();
                  }}
                >
                  <X className="w-4 h-4 hover:text-destructive" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={dateMode === "single" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateMode("single")}
                  className="flex-1"
                >
                  Tag
                </Button>
                <Button
                  variant={dateMode === "range" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateMode("range")}
                  className="flex-1"
                >
                  Zeitraum
                </Button>
              </div>

              {/* Calendar */}
              {dateMode === "single" ? (
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={de}
                  className="pointer-events-auto"
                />
              ) : (
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={de}
                  numberOfMonths={1}
                  className="pointer-events-auto"
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {dateFilter && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      clearDateFilter();
                      setDatePopoverOpen(false);
                    }} 
                    className="flex-1"
                  >
                    Zurücksetzen
                  </Button>
                )}
                <Button 
                  onClick={applyDateFilter} 
                  className="flex-1"
                  disabled={dateMode === "single" ? !selectedDate : !dateRange?.from}
                >
                  Anwenden
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Location Filter */}
        <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full sm:w-auto justify-start gap-2 bg-card",
                locationFilter && "border-primary"
              )}
            >
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[120px]">
                {locationFilter ? `${locationFilter.name} (${locationFilter.radius}km)` : "Standort"}
              </span>
              {locationFilter && (
                <span
                  role="button"
                  className="ml-auto p-1 -mr-1 rounded-full hover:bg-destructive/10 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearLocationFilter();
                  }}
                >
                  <X className="w-4 h-4 hover:text-destructive" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Flugplatz auswählen</label>
                <AirportCombobox
                  value={selectedAirportIcao}
                  onSelect={(airport) => {
                    if (airport) {
                      setSelectedAirportIcao(airport.icao);
                      setPendingAirportData({ 
                        name: `${airport.name} (${airport.icao})`, 
                        lat: airport.lat, 
                        lon: airport.lon 
                      });
                    } else {
                      setSelectedAirportIcao("");
                      setPendingAirportData(null);
                    }
                  }}
                  placeholder="Flugplatz suchen..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Radius: {radius} km
                </label>
                <Slider
                  value={[radius]}
                  onValueChange={(value) => setRadius(value[0])}
                  min={10}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 km</span>
                  <span>200 km</span>
                </div>
              </div>

              <Button 
                onClick={applyLocationFilter} 
                className="w-full"
                disabled={!pendingAirportData?.lat}
              >
                Anwenden
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card">
            <SelectValue placeholder="Sortieren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_asc">Datum aufsteigend</SelectItem>
            <SelectItem value="date_desc">Datum absteigend</SelectItem>
            <SelectItem value="participants">Beliebteste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {(dateFilter || locationFilter) && (
        <div className="flex flex-wrap gap-2">
          {dateFilter && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="w-3 h-3" />
              {getDateLabel()}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={clearDateFilter}
              />
            </Badge>
          )}
          {locationFilter && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="w-3 h-3" />
              {locationFilter.name} ({locationFilter.radius}km)
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={clearLocationFilter}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFilters;