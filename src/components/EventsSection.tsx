import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plane, ArrowRight } from "lucide-react";

const events = [
  {
    title: "Fly-out zum Bodensee",
    type: "Fly-out",
    date: "15. Feb 2026",
    time: "09:00 Uhr",
    airport: "EDNY - Friedrichshafen",
    participants: 8,
    maxParticipants: 12,
    image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600&h=400&fit=crop",
  },
  {
    title: "Pilotentstammtisch München",
    type: "Stammtisch",
    date: "20. Feb 2026",
    time: "19:00 Uhr",
    airport: "EDDM - München",
    participants: 15,
    maxParticipants: 25,
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop",
  },
  {
    title: "Inselhopping Nordsee",
    type: "Fly-out",
    date: "28. Feb 2026",
    time: "08:00 Uhr",
    airport: "EDXW - Westerland/Sylt",
    participants: 5,
    maxParticipants: 8,
    image: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=600&h=400&fit=crop",
  },
];

const EventsSection = () => {
  return (
    <section id="events" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
              Events
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
              Kommende Fly-outs
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Schließe dich spannenden Fly-outs an oder organisiere dein eigenes Event.
            </p>
          </div>
          <Button variant="outline" size="lg" className="group">
            Alle Events ansehen
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <div
              key={event.title}
              className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 card-shadow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute top-4 left-4 bg-white/90 text-foreground backdrop-blur-sm">
                  {event.type}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-heading font-bold text-xl text-foreground mb-4 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      {event.date} • {event.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm">{event.airport}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      {event.participants}/{event.maxParticipants} Teilnehmer
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full hero-gradient rounded-full transition-all duration-500"
                      style={{
                        width: `${(event.participants / event.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Button variant="default" className="w-full group/btn">
                  <Plane className="w-4 h-4" />
                  Teilnehmen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
