import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plane, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useEvents, useMyEvents, useJoinEvent, useLeaveEvent } from "@/hooks/useEvents";
import EventCard, { EventData } from "@/components/events/EventCard";
import EventFilters, { DateFilter, LocationFilter } from "@/components/events/EventFilters";
import EventFormDialog from "@/components/events/EventFormDialog";
import EventDetailDialog from "@/components/events/EventDetailDialog";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Events = () => {
  const { user, profile } = useAuth();
  const { hasActiveAccess } = useAccessStatus();
  const [activeTab, setActiveTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [dateFilter, setDateFilter] = useState<DateFilter | undefined>();
  const [locationFilter, setLocationFilter] = useState<LocationFilter | undefined>();
  
  // State for event detail dialog
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch all events (meetups + stammtisch)
  const { data: allEvents, isLoading: isLoadingAll, refetch: refetchAll } = useEvents({
    searchQuery,
    eventType: activeTab === "flyouts" ? "flyout" : activeTab === "events" ? "events_only" : "all",
    sortBy,
    dateFilter,
    locationFilter,
  });

  // Fetch my events
  const { data: myEvents, isLoading: isLoadingMy, refetch: refetchMy } = useMyEvents(profile?.id);

  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();

  const handleJoinEvent = (eventId: string) => {
    if (!profile?.id) return;
    joinEvent.mutate({ eventId, profileId: profile.id });
  };

  const handleLeaveEvent = (eventId: string) => {
    if (!profile?.id) return;
    leaveEvent.mutate({ eventId, profileId: profile.id });
  };

  const handleRefetch = () => {
    refetchAll();
    refetchMy();
  };

  const handleEventCreated = (eventId: string) => {
    // Find the created event and open detail dialog
    handleRefetch();
    // We'll set a timeout to allow data to refresh, then find and open the event
    setTimeout(() => {
      const event = allEvents?.find(e => e.id === eventId) || myEvents?.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event as EventData);
        setDetailDialogOpen(true);
      }
    }, 500);
  };

  const handleEventClick = (event: EventData) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  // Get current events based on tab
  const currentEvents = activeTab === "meine" ? myEvents : allEvents;
  const isLoading = activeTab === "meine" ? isLoadingMy : isLoadingAll;

  // Group events by month
  type EventType = NonNullable<typeof currentEvents>[number];
  const groupedEvents = useMemo(() => {
    if (!currentEvents || currentEvents.length === 0) return {};
    
    return currentEvents.reduce<Record<string, { name: string; events: EventType[] }>>((acc, event) => {
      const date = new Date(event.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { name: monthName, events: [] };
      }
      acc[monthKey].events.push(event);
      return acc;
    }, {});
  }, [currentEvents]);

  const getTabTitle = () => {
    switch (activeTab) {
      case "flyouts":
        return "Fly-Outs";
      case "meine":
        return "Meine Events";
      default:
        return "Events & Fly-Ins";
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case "flyouts":
        return "Gemeinsam abheben – finde Gruppenflüge zu spannenden Zielen.";
      case "meine":
        return "Deine Events, an denen du teilnimmst oder die du organisiert hast.";
      default:
        return "Entdecke Fly-Ins und Stammtische in deiner Nähe.";
    }
  };

  return (
    <DashboardLayout>
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="section-decoration-blob w-96 h-96 -top-48 right-1/4 opacity-5" />
      </div>

      {/* Header with Tabs - Enhanced */}
      <section className="py-6 sm:py-8 bg-gradient-to-b from-card to-background border-b border-border/50 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold">
                  {getTabTitle()}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {getTabDescription()}
                </p>
              </div>
            </div>

            {user && hasActiveAccess && profile?.id && (
              <EventFormDialog 
                profileId={profile.id} 
                onEventSaved={handleRefetch}
                onEventCreated={handleEventCreated}
              />
            )}
            {!user && (
              <Button asChild className="shadow-lg">
                <Link to="/auth">Anmelden um teilzunehmen</Link>
              </Button>
            )}
            {user && !hasActiveAccess && (
              <Button variant="outline" asChild>
                <Link to="/subscribe">Mitglied werden</Link>
              </Button>
            )}
          </div>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:w-auto bg-muted/50 p-1.5 rounded-xl border border-border/50">
              <TabsTrigger 
                value="events" 
                className="flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
              >
                Events
              </TabsTrigger>
              <TabsTrigger 
                value="flyouts"
                className="flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
              >
                Fly-Outs
              </TabsTrigger>
              <TabsTrigger 
                value="meine"
                className="flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
              >
                Meine Events
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Filters - not shown for "Meine Events" */}
      {activeTab !== "meine" && (
        <section className="py-4 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <EventFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              locationFilter={locationFilter}
              onLocationFilterChange={setLocationFilter}
            />
          </div>
        </section>
      )}

      {/* Events List */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : currentEvents && currentEvents.length > 0 ? (
            <div className="space-y-10">
              {Object.entries(groupedEvents)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([monthKey, { name, events: monthEvents }]) => (
                  <div key={monthKey}>
                    <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-5 h-5 text-primary" />
                      {name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {monthEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event as EventData}
                          onJoin={handleJoinEvent}
                          onLeave={handleLeaveEvent}
                          onRefresh={handleRefetch}
                          isPremium={hasActiveAccess}
                          currentProfileId={profile?.id}
                          onClick={() => handleEventClick(event as EventData)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Plane className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">
                {activeTab === "meine" ? "Noch keine Events" : "Keine Events gefunden"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === "meine"
                  ? "Du nimmst noch an keinem Event teil."
                  : searchQuery
                    ? "Versuche andere Suchbegriffe."
                    : "Sei der Erste und erstelle ein neues Event!"}
              </p>
              {activeTab === "meine" && (
                <Button onClick={() => setActiveTab("events")}>
                  Events entdecken
                </Button>
              )}
              {activeTab !== "meine" && user && hasActiveAccess && profile?.id && (
                <EventFormDialog 
                  profileId={profile.id} 
                  onEventSaved={handleRefetch}
                  onEventCreated={handleEventCreated}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onJoin={handleJoinEvent}
        onLeave={handleLeaveEvent}
        onRefresh={handleRefetch}
        isPremium={hasActiveAccess}
        currentProfileId={profile?.id}
      />
    </DashboardLayout>
  );
};

export default Events;
