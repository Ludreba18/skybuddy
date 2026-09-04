import { Users, Calendar, MessageCircle, MapPin, Shield, Award } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Piloten-Community",
    description: "Vernetze dich mit PPL, LAPL und CPL-Piloten in deiner Region. Teile Erfahrungen und lerne von anderen.",
  },
  {
    icon: Calendar,
    title: "Fly-outs & Events",
    description: "Organisiere und nimm teil an Fly-outs, Flugplatz-Treffen und Stammtischen in ganz Europa.",
  },
  {
    icon: MessageCircle,
    title: "Forum & Austausch",
    description: "Diskutiere über Technik, Ausbildung, Reisen und Safety. Die Community hilft bei allen Fragen.",
  },
  {
    icon: MapPin,
    title: "Flugplatzdatenbank",
    description: "Alle europäischen Flughäfen und Flugplätze mit ICAO-Codes. Finde den perfekten Treffpunkt.",
  },
  {
    icon: Shield,
    title: "Sicherheit first",
    description: "Verifizierte Profile und Community-Richtlinien für einen respektvollen, sicheren Austausch.",
  },
  {
    icon: Award,
    title: "Detaillierte Profile",
    description: "Zeige deine Lizenzen, Flugstunden, Flugzeugtypen und Interessen. Finde passende Flugpartner.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Features
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Alles für deine Fliegerei
          </h2>
          <p className="text-lg text-muted-foreground">
            SkyBuddy bietet dir alle Tools, um dich mit anderen Piloten zu vernetzen, 
            gemeinsam zu fliegen und die Allgemeine Luftfahrt lebendig zu halten.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 card-shadow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl hero-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
