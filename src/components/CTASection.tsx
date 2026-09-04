import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plane, Gift } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trial Badge */}
          <div className="inline-flex items-center gap-2 sunset-gradient text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg mb-8">
            <Gift className="w-4 h-4" />
            30 Tage kostenlos testen
          </div>

          {/* Content */}
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Bereit für neue{" "}
            <span className="text-gradient-sky">Flugabenteuer?</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Teste SkyBuddy 30 Tage lang mit vollem Zugang – komplett kostenlos 
            und unverbindlich. Entdecke, wie viel schöner Fliegen mit Gleichgesinnten ist.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="group" asChild>
              <Link to="/auth">
                Jetzt 30 Tage gratis starten
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              ✓ 30 Tage voller Zugang
            </span>
            <span className="flex items-center gap-2">
              ✓ DSGVO-konform
            </span>
            <span className="flex items-center gap-2">
              ✓ Keine Kreditkarte nötig
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
