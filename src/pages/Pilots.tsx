import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { usePaginatedPilots, PilotProfile } from "@/hooks/usePaginatedPilots";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Plane, Search, X, Filter, Award, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PilotDetailSheet } from "@/components/pilots/PilotDetailSheet";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AirportCombobox from "@/components/airports/AirportCombobox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types are imported from usePaginatedPilots hook

const LICENSE_TYPES = [
  { value: "UL", label: "UL (Ultraleicht)" },
  { value: "PPL_A", label: "PPL(A)" },
  { value: "LAPL", label: "LAPL" },
  { value: "CPL", label: "CPL" },
  { value: "FI", label: "FI (Fluglehrer)" },
  { value: "IR", label: "IR (Instrumentenflug)" },
  { value: "ATPL", label: "ATPL" },
];

const COMMON_INTERESTS = [
  "Alpenrundflüge",
  "Fly-Outs",
  "Nachtflug",
  "IFR-Training",
  "Kunstflug",
  "Langstrecke",
  "Fotografie",
  "Segelflug",
  "Formation",
  "Reisen",
];

const PilotCard = ({ pilot, licenses, interests, onClick }: { 
  pilot: PilotProfile; 
  licenses?: string[];
  interests?: string[];
  onClick: () => void;
}) => {
  const displayName = pilot.nickname || 
    [pilot.first_name, pilot.last_name].filter(Boolean).join(" ") || 
    "Unbekannter Pilot";
  
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Card 
      className="bg-card rounded-2xl border border-border/50 shadow-md hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden" 
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-5 relative">
        <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
          {/* Avatar with ring effect */}
          <div className="relative">
            <Avatar className="h-14 w-14 sm:h-20 sm:w-20 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-105">
              <AvatarImage src={pilot.avatar_url || undefined} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary text-sm sm:text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="space-y-0.5 sm:space-y-1 w-full">
            <h3 className="font-heading font-semibold text-foreground text-xs sm:text-base truncate group-hover:text-primary transition-colors">{displayName}</h3>
          </div>

          <div className="w-full space-y-1.5 sm:space-y-2 text-[10px] sm:text-sm text-muted-foreground">
            {(pilot.home_airport_name || pilot.home_airport_icao) && (
              <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
                <span className="truncate font-medium">
                  {pilot.home_airport_icao || pilot.home_airport_name}
                </span>
              </div>
            )}
            
            {pilot.flight_hours !== null && pilot.flight_hours > 0 && (
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary shrink-0" />
                <span className="font-semibold text-foreground">{pilot.flight_hours}h</span>
                <span className="text-muted-foreground">Flugzeit</span>
              </div>
            )}

            {licenses && licenses.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 pt-1">
                {licenses.slice(0, 2).map((license) => (
                  <Badge key={license} variant="secondary" className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-primary/10 text-primary border-0 font-semibold">
                    {license.replace("_", "(")}
                    {license.includes("_") && ")"}
                  </Badge>
                ))}
                {licenses.length > 2 && (
                  <Badge variant="secondary" className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-muted">
                    +{licenses.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PilotCardSkeleton = () => (
  <Card>
    <CardContent className="p-3 sm:p-4">
      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
        <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-full" />
        <Skeleton className="h-4 sm:h-5 w-16 sm:w-24" />
        <div className="space-y-1.5 sm:space-y-2 w-full">
          <Skeleton className="h-3 sm:h-4 w-14 sm:w-20 mx-auto" />
          <Skeleton className="h-3 sm:h-4 w-16 sm:w-28 mx-auto" />
        </div>
      </div>
    </CardContent>
  </Card>
);


const Pilots = () => {
  const { user } = useAuth();
  const [selectedPilot, setSelectedPilot] = useState<PilotProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [flightHoursFilter, setFlightHoursFilter] = useState<string>("all");
  const [airportFilter, setAirportFilter] = useState<string>("");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Use paginated hook with server-side filtering
  const {
    pilots,
    totalCount,
    currentPage,
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
    pageSize,
  } = usePaginatedPilots({
    searchQuery: debouncedSearchQuery,
    airportFilter,
    flightHoursFilter,
    selectedLicenses,
    selectedInterests,
  });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [searchQuery, airportFilter, flightHoursFilter, selectedLicenses, selectedInterests, resetPage]);

  const activeFilterCount = [
    airportFilter !== "",
    flightHoursFilter !== "all",
    selectedLicenses.length > 0,
    selectedInterests.length > 0,
  ].filter(Boolean).length;

  const hasActiveFilters = searchQuery !== "" || activeFilterCount > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setFlightHoursFilter("all");
    setAirportFilter("");
    setSelectedLicenses([]);
    setSelectedInterests([]);
  };

  const toggleLicense = (license: string) => {
    setSelectedLicenses((prev) =>
      prev.includes(license) ? prev.filter((l) => l !== license) : [...prev, license]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  return (
    <DashboardLayout>
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="section-decoration-blob w-96 h-96 -top-48 -left-48 opacity-5" />
        <div className="section-decoration-blob w-64 h-64 bottom-1/4 -right-32 opacity-5" />
      </div>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 relative">
        {/* Page Header with enhanced styling */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading">Piloten</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Finde Flugpartner in deiner Nähe</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Name oder Flughafen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          
          {/* Filter Sheet for mobile + desktop */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 hidden sm:flex">
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>Filter</span>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Zurücksetzen
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                <div className="space-y-6 py-4">
                  {/* Flughafen */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Heimatflughafen
                    </label>
                    <AirportCombobox
                      value={airportFilter}
                      onSelect={(airport) => setAirportFilter(airport?.icao || "")}
                      placeholder="Flughafen wählen..."
                    />
                    {airportFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setAirportFilter("")}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {airportFilter} entfernen
                      </Button>
                    )}
                  </div>

                  {/* Flugstunden */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Flugstunden
                    </label>
                    <Select value={flightHoursFilter} onValueChange={setFlightHoursFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Flugstunden" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Flugstunden</SelectItem>
                        <SelectItem value="0-100">0 - 100 Std.</SelectItem>
                        <SelectItem value="100-300">100 - 300 Std.</SelectItem>
                        <SelectItem value="300-500">300 - 500 Std.</SelectItem>
                        <SelectItem value="500+">500+ Std.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lizenzen */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Lizenzen
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LICENSE_TYPES.map((license) => (
                        <Badge
                          key={license.value}
                          variant={selectedLicenses.includes(license.value) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => toggleLicense(license.value)}
                        >
                          {license.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interessen */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      Interessen
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_INTERESTS.map((interest) => (
                        <Badge
                          key={interest}
                          variant={selectedInterests.includes(interest) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Filter zurücksetzen">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active filters display */}
        {(selectedLicenses.length > 0 || selectedInterests.length > 0 || airportFilter) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {airportFilter && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {airportFilter}
                <button onClick={() => setAirportFilter("")} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedLicenses.map((lic) => (
              <Badge key={lic} variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                {lic.replace("_", "(")}
                {lic.includes("_") && ")"}
                <button onClick={() => toggleLicense(lic)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedInterests.map((int) => (
              <Badge key={int} variant="secondary" className="gap-1">
                <Heart className="h-3 w-3" />
                {int}
                <button onClick={() => toggleInterest(int)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
          {pilots.length > 0 ? (
            <>
              Seite {currentPage + 1} von {totalPages} ({totalCount} Piloten gesamt)
              {isFetching && !isLoading && <span className="ml-2 text-primary">Lädt...</span>}
            </>
          ) : (
            "Keine Piloten gefunden"
          )}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <PilotCardSkeleton key={i} />
            ))}
          </div>
        ) : pilots && pilots.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {pilots.map((pilot) => (
                <PilotCard 
                  key={pilot.id} 
                  pilot={pilot} 
                  licenses={licensesByPilot[pilot.id]}
                  interests={interestsByPilot[pilot.id]}
                  onClick={() => setSelectedPilot(pilot)} 
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadPreviousPage}
                  disabled={!hasPreviousPage || isFetching}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Zurück</span>
                </Button>
                
                <div className="flex items-center gap-1">
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        disabled={isFetching}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadNextPage}
                  disabled={!hasNextPage || isFetching}
                  className="gap-1"
                >
                  <span className="hidden sm:inline">Weiter</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Piloten mit diesen Filtern gefunden.</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Filter zurücksetzen
              </Button>
            )}
          </div>
        )}
      </main>

      <PilotDetailSheet
        pilot={selectedPilot}
        open={!!selectedPilot}
        onOpenChange={(open) => !open && setSelectedPilot(null)}
      />
    </DashboardLayout>
  );
};

export default Pilots;
