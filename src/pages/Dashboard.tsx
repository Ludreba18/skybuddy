import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useMyEvents } from "@/hooks/useEvents";
import { useUpdateOnlineStatus, isRecentlyOnline } from "@/hooks/useOnlineStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityFeed from "@/components/feed/ActivityFeed";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PilotDetailSheet } from "@/components/pilots/PilotDetailSheet";
import { User, Calendar, MessageCircle, Users, Crown, Plus, Settings, Eye, Heart, UserPlus, ChevronRight, MapPin } from "lucide-react";
const Dashboard = () => {
  const {
    user,
    profile
  } = useAuth();
  const {
    hasActiveAccess,
    isPremium,
    isInTrial,
    daysRemaining
  } = useAccessStatus();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState("profil");
  const isMobile = useIsMobile();

  // All hooks MUST be called before any conditional returns
  const profileId = profile?.id;

  // Track online status
  useUpdateOnlineStatus(profileId);

  // Fetch real contacts
  const {
    data: contacts = []
  } = useContacts(profileId);

  // Fetch my upcoming events
  const {
    data: myEvents = []
  } = useMyEvents(profileId);

  // DashboardLayout handles loading/redirect, but we still need to guard here
  if (!user || !profile) {
    return null;
  }
  const displayName = profile.nickname || profile.first_name || "Pilot";
  const upcomingEvents = myEvents.slice(0, 3);

  // Stats for the profile section
  const profileStats = [{
    icon: Eye,
    value: 0,
    label: "Profilaufrufe"
  }, {
    icon: UserPlus,
    value: 0,
    label: "Flugpartner"
  }, {
    icon: Heart,
    value: 0,
    label: "Likes erhalten"
  }, {
    icon: Users,
    value: 0,
    label: "Piloten folgen dir"
  }];
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
  };
  return <DashboardLayout>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="section-decoration-blob w-96 h-96 -top-48 -right-48 opacity-10" />
        <div className="section-decoration-blob w-64 h-64 top-1/3 -left-32 opacity-5" />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 relative">
        {/* Profile Card - Always visible */}
        <div className="premium-card overflow-hidden group mb-4 sm:mb-6">
          {/* Gradient accent bar */}
          <div className="h-1 hero-gradient" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-heading text-lg sm:text-xl font-bold">Mein SkyBuddy</h2>
              <div className="flex items-center gap-1">
                <Link to="/account" className="p-2 rounded-xl hover:bg-primary/10 transition-all duration-200 hover:scale-105" title="Konto & Abonnement">
                  <Crown className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </Link>
                <Link to="/profile" className="p-2 rounded-xl hover:bg-primary/10 transition-all duration-200 hover:scale-105">
                  <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover" /> : <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
                </div>
                {isPremium && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center ring-2 ring-card">
                    <Crown className="w-3 h-3 text-white" />
                  </div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-bold text-base sm:text-lg truncate">{displayName}</h3>
                  {isPremium ? <span className="inline-flex items-center bg-gradient-to-r from-accent/20 to-accent/10 text-accent text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 border border-accent/20">
                      Premium
                    </span> : isInTrial ? <span className="inline-flex items-center bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 border border-primary/20">
                      Test ({daysRemaining}d)
                    </span> : null}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {profile.home_airport_icao || "Kein Heimatflugplatz"} • {profile.flight_hours || 0}h Flugerfahrung
                </p>
              </div>
            </div>

            {/* Status Input with glow effect */}
            

            {/* Mobile Tab Navigation */}
            {isMobile && <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="w-full grid grid-cols-3 h-auto p-1">
                  <TabsTrigger value="profil" className="text-xs py-2 px-2">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Profil
                  </TabsTrigger>
                  <TabsTrigger value="kontakte" className="text-xs py-2 px-2">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Kontakte
                  </TabsTrigger>
                  <TabsTrigger value="events" className="text-xs py-2 px-2">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Events
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Profil Stats */}
                <TabsContent value="profil" className="mt-4">
                  <div className="grid grid-cols-4 gap-2">
                    {profileStats.map((stat, index) => <div key={index} className="text-center p-2 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-1">
                          <stat.icon className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-heading font-bold text-base text-gradient-sky">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                      </div>)}
                  </div>
                </TabsContent>

                {/* Tab: Kontakte */}
                <TabsContent value="kontakte" className="mt-4">
                  {/* Trial CTA for mobile */}
                  {isInTrial && <div className="relative rounded-xl p-4 overflow-hidden mb-4">
                      <div className="absolute inset-0 hero-gradient animate-gradient opacity-95" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white">Testphase: {daysRemaining} Tage</p>
                          <Button variant="secondary" size="sm" className="mt-2 bg-white text-primary hover:bg-white/90 font-semibold text-xs h-7" asChild>
                            <Link to="/account">Mitglied werden</Link>
                          </Button>
                        </div>
                      </div>
                    </div>}
                  
                  {contacts.length > 0 ? <div className="space-y-2">
                      {contacts.slice(0, 5).map(contact => <button key={contact.id} onClick={() => handleContactClick(contact)} className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-muted/30 to-transparent border border-border/50 hover:border-primary/20 transition-all duration-200 w-full text-left">
                          <div className="relative">
                            <Avatar className="w-9 h-9 ring-2 ring-border">
                              <AvatarImage src={contact.avatarUrl || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary text-xs font-semibold">
                                {contact.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isRecentlyOnline(contact.lastSeenAt || null) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full animate-pulse" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{contact.name}</p>
                            {contact.homeAirport && <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                {contact.homeAirport}
                              </p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>)}
                    </div> : <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Noch keine Kontakte</p>
                      <Button variant="link" size="sm" asChild className="text-xs">
                        <Link to="/pilots">Piloten entdecken</Link>
                      </Button>
                    </div>}
                </TabsContent>

                {/* Tab: Events */}
                <TabsContent value="events" className="mt-4">
                  {upcomingEvents.length > 0 ? <div className="space-y-2">
                      {upcomingEvents.map(event => {
                  const eventDate = new Date(event.event_date);
                  return <Link key={event.id} to="/events?tab=meine" className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-muted/30 to-transparent border border-border/50 hover:border-primary/20 transition-all duration-200">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col items-center justify-center shrink-0 border border-primary/10">
                              <span className="text-[10px] font-semibold text-primary uppercase">
                                {format(eventDate, "MMM", {
                          locale: de
                        })}
                              </span>
                              <span className="text-base font-bold text-primary leading-none">
                                {format(eventDate, "d")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{event.title}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{event.airport_name || event.airport_icao || "Ort TBD"}</span>
                              </div>
                            </div>
                          </Link>;
                })}
                    </div> : <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Keine Events geplant</p>
                      {hasActiveAccess && <Button variant="link" size="sm" asChild className="text-xs">
                          <Link to="/events">Events entdecken</Link>
                        </Button>}
                    </div>}
                  {hasActiveAccess && <Button variant="outline" size="sm" className="w-full mt-3 text-xs" asChild>
                      <Link to="/events?create=true">
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Event erstellen
                      </Link>
                    </Button>}
                </TabsContent>
              </Tabs>}
          </div>
        </div>

        {/* Desktop: Two-column layout / Mobile: Single column */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Stats (Desktop only) and Feed */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Stats Grid - Desktop only */}
            {!isMobile && <div className="premium-card p-4 sm:p-6">
                <h3 className="font-heading font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  Dein Profil weckt Interesse
                </h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  {profileStats.map((stat, index) => <div key={index} className="text-center p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <p className="font-heading font-bold text-base sm:text-xl text-gradient-sky">{stat.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{stat.label}</p>
                    </div>)}
                </div>
              </div>}

            {/* Activity Feed with enhanced styling */}
            <div className="premium-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-heading font-bold text-base sm:text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  Neuigkeiten
                </h3>
              </div>
              <ActivityFeed profileId={profile.id} userId={user.id} avatarUrl={profile.avatar_url} isPremium={hasActiveAccess} showCreateForm={true} />
            </div>
          </div>

          {/* Right Sidebar - Desktop only */}
          {!isMobile && <div className="space-y-4 sm:space-y-6">
            {/* Membership CTA - Show when in trial */}
            {isInTrial && <div className="relative rounded-2xl p-4 sm:p-6 overflow-hidden group">
                {/* Animated gradient background */}
                <div className="absolute inset-0 hero-gradient animate-gradient opacity-95" />
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 blur-xl" />
                
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg mb-1 sm:mb-2 text-white">
                    Testphase: {daysRemaining} Tage übrig
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 mb-4">
                    Sichere dir jetzt deinen dauerhaften Zugang zur SkyBuddy-Community.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full bg-white text-primary hover:bg-white/90 font-semibold shadow-lg" asChild>
                    <Link to="/account">Jetzt Mitglied werden</Link>
                  </Button>
                </div>
              </div>}

            {/* Contacts - Enhanced card */}
            <div className="premium-card overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-muted/30 to-transparent">
                <h3 className="font-heading font-bold text-sm sm:text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Meine Kontakte
                </h3>
                <Link to="/messages" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {contacts.length > 0 ? <div className="divide-y divide-border/50">
                  {contacts.slice(0, 5).map(contact => <button key={contact.id} onClick={() => handleContactClick(contact)} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 w-full text-left group">
                      <div className="relative">
                        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                          <AvatarImage src={contact.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary text-xs sm:text-sm font-semibold">
                            {contact.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isRecentlyOnline(contact.lastSeenAt || null) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-card rounded-full animate-pulse" title="Online" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{contact.name}</p>
                        {contact.homeAirport && <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {contact.homeAirport}
                          </p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>)}
                </div> : <div className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Noch keine Kontakte</p>
                  <Button variant="link" size="sm" asChild className="text-xs sm:text-sm">
                    <Link to="/pilots">Piloten entdecken</Link>
                  </Button>
                </div>}
            </div>

            {/* Upcoming Events - Enhanced */}
            <div className="premium-card overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-muted/30 to-transparent">
                <h3 className="font-heading font-bold text-sm sm:text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Meine Events
                </h3>
                <Link to="/events?tab=meine" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {upcomingEvents.length > 0 ? <div className="divide-y divide-border/50">
                  {upcomingEvents.map(event => {
                const eventDate = new Date(event.event_date);
                return <Link key={event.id} to="/events?tab=meine" className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                          <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase">
                            {format(eventDate, "MMM", {
                        locale: de
                      })}
                          </span>
                          <span className="text-base sm:text-lg font-bold text-primary leading-none">
                            {format(eventDate, "d")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{event.title}</p>
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.airport_name || event.airport_icao || "Ort TBD"}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>;
              })}
                </div> : <div className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Keine kommenden Events</p>
                  <Button variant="link" size="sm" asChild className="text-xs sm:text-sm">
                    <Link to="/events">Events entdecken</Link>
                  </Button>
                </div>}
            </div>

            {/* Quick Links - Hidden on mobile (bottom nav replaces this) */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 hidden sm:block">
              <div className="grid grid-cols-2 gap-2">
                <Link to="/events" className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Events</span>
                </Link>
                <Link to="/forum" className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Forum</span>
                </Link>
                <Link to="/pilots" className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Piloten</span>
                </Link>
                {isPremium && <Link to="/events" className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Plus className="w-4 h-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">Event +</span>
                  </Link>}
              </div>
            </div>
            </div>}
        </div>
      </main>

      {/* Pilot Detail Sheet */}
      <PilotDetailSheet pilot={selectedContact ? {
      id: selectedContact.profileId,
      first_name: selectedContact.first_name || null,
      last_name: selectedContact.last_name || null,
      nickname: selectedContact.nickname || null,
      avatar_url: selectedContact.avatarUrl,
      flight_hours: selectedContact.flightHours,
      home_airport_name: null,
      home_airport_icao: selectedContact.homeAirport,
      bio: selectedContact.bio,
      location: selectedContact.location
    } : null} open={!!selectedContact} onOpenChange={open => !open && setSelectedContact(null)} />
    </DashboardLayout>;
};
export default Dashboard;