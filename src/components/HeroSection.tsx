import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, ArrowRight, Gift } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Animated clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-16 bg-white/20 rounded-full blur-2xl animate-float" />
        <div className="absolute top-40 right-20 w-48 h-24 bg-white/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-40 left-1/4 w-40 h-20 bg-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute top-1/3 right-1/3 w-24 h-12 bg-white/20 rounded-full blur-xl animate-float-delayed" />
      </div>

      {/* Flying plane animation */}
      <div className="absolute top-32 animate-plane-fly opacity-30">
        <Plane className="w-8 h-8 text-white transform rotate-45" />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-8 animate-fade-up">
            <Gift className="w-4 h-4 text-accent" />
            <span className="text-white/90 text-sm font-medium">
              30 Tage kostenlos testen – keine Kreditkarte nötig
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Fly together.
            <br />
            <span className="text-white/90">Share the sky.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            SkyBuddy verbindet Privatpiloten, Flugschüler und Luftfahrtbegeisterte 
            in ganz Europa. Finde Flugpartner, teile Erfahrungen und erlebe 
            unvergessliche Fly-outs.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="w-full sm:w-auto group" asChild>
              <Link to="/auth">
                30 Tage gratis starten
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto" asChild>
              <a href="#features">Mehr erfahren</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
