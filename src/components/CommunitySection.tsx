import { Badge } from "@/components/ui/badge";
import { MapPin, Award, Plane } from "lucide-react";

const pilots = [
  {
    name: "Thomas M.",
    location: "München, BY",
    airport: "EDDM",
    license: "PPL(A)",
    hours: "320h",
    aircraft: ["C172", "PA-28"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Sarah K.",
    location: "Hamburg, HH",
    airport: "EDDH",
    license: "LAPL",
    hours: "85h",
    aircraft: ["C152", "DA20"],
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Michael B.",
    location: "Frankfurt, HE",
    airport: "EDDF",
    license: "CPL",
    hours: "1200h",
    aircraft: ["DA40", "DA42", "C182"],
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Lisa W.",
    location: "Berlin, BE",
    airport: "EDDB",
    license: "PPL(A), FI",
    hours: "650h",
    aircraft: ["PA-28", "C172"],
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  },
];

const CommunitySection = () => {
  return (
    <section id="community" className="py-24 sky-gradient-soft">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Community
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Triff andere Piloten
          </h2>
          <p className="text-lg text-muted-foreground">
            Entdecke Piloten in deiner Nähe, lerne von Erfahrenen und finde 
            deinen nächsten Flugpartner für gemeinsame Abenteuer.
          </p>
        </div>

        {/* Pilot Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pilots.map((pilot, index) => (
            <div
              key={pilot.name}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 card-shadow group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Avatar */}
              <div className="relative mb-6">
                <img
                  src={pilot.image}
                  alt={pilot.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-white shadow-lg group-hover:ring-primary/20 transition-all"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs shadow-md">
                    {pilot.license}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="text-center">
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                  {pilot.name}
                </h3>
                
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{pilot.location}</span>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-primary text-sm font-medium mb-4">
                  <Plane className="w-3.5 h-3.5" />
                  <span>{pilot.airport}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Award className="w-3 h-3" />
                    {pilot.hours}
                  </div>
                </div>

                {/* Aircraft */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {pilot.aircraft.map((ac) => (
                    <span
                      key={ac}
                      className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium"
                    >
                      {ac}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
