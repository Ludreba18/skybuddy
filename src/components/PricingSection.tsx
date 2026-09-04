import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Gift } from "lucide-react";

const PricingSection = () => {
  const features = [
    "Unbegrenzte Nachrichten & Gruppenchats",
    "An Events & Fly-Outs teilnehmen",
    "Eigene Events erstellen",
    "Bilder & Berichte hochladen",
    "Forum-Beiträge schreiben",
    "Erweiterte Piloten-Suche",
    "Exklusive Community-Gruppen",
    "Voller Zugang zu allen Features",
  ];

  return (
    <section id="pricing" className="py-24 sky-gradient-soft">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Preise
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ein einfaches Modell
          </h2>
          <p className="text-lg text-muted-foreground">
            Teste SkyBuddy 30 Tage lang kostenlos und unverbindlich. Danach für nur 9,99 €/Monat.
          </p>
        </div>

        {/* Single Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="relative bg-card rounded-2xl p-8 border-2 border-accent shadow-xl shadow-accent/20 transition-all duration-300 hover:-translate-y-2">
            {/* Trial badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-1.5 sunset-gradient text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                <Gift className="w-4 h-4" />
                30 Tage kostenlos testen
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8 pt-4">
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                SkyBuddy Mitgliedschaft
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Voller Zugang zu allen Features
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-heading text-5xl font-bold text-foreground">
                  €9,99
                </span>
                <span className="text-muted-foreground">/Monat</span>
              </div>
              <p className="text-sm text-primary font-medium mt-2">
                Erste 30 Tage komplett kostenlos!
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              asChild
            >
              <Link to="/auth">
                <Sparkles className="w-4 h-4 mr-2" />
                Kostenlos starten
              </Link>
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Keine Kreditkarte erforderlich. Jederzeit kündbar.
            </p>
          </div>
        </div>

        {/* Payment info */}
        <p className="text-center text-muted-foreground text-sm mt-8">
          Nach der Testphase: Sichere Zahlung via PayPal.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
