import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Kontakt = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="font-heading text-4xl font-bold mb-2">Kontakt</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Du hast eine Frage, einen Fehler gefunden oder möchtest einfach Hallo sagen?
          SkyBuddy wird von einer Person entwickelt und betreut — schreib mir gerne direkt,
          ich melde mich so schnell wie möglich zurück.
        </p>

        <a
          href="mailto:info@ld-solutions.de"
          className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all w-fit"
        >
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">E-Mail</p>
            <p className="text-primary">info@ld-solutions.de</p>
          </div>
        </a>
      </main>

      <Footer />
    </div>
  );
};

export default Kontakt;
