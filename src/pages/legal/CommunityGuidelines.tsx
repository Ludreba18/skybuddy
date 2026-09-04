import { ArrowLeft, Shield, Heart, Users, AlertTriangle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const CommunityGuidelines = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-heading text-4xl font-bold mb-4">Community-Richtlinien</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gemeinsam für eine sichere und respektvolle Piloten-Community ✈️
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          {/* Intro */}
          <section className="bg-primary/5 rounded-xl p-6 border border-primary/20">
            <p className="text-foreground">
              SkyBuddy ist eine Community von Piloten für Piloten. Wir teilen die Leidenschaft 
              für die Fliegerei und möchten einen Ort schaffen, an dem sich alle willkommen und 
              sicher fühlen. Diese Richtlinien helfen uns dabei.
            </p>
          </section>

          {/* Core Values */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              Unsere Grundwerte
            </h2>
            
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Respekt & Freundlichkeit</h3>
                  <p className="text-muted-foreground text-sm">
                    Behandle andere so, wie du selbst behandelt werden möchtest. Jeder Pilot war 
                    einmal Anfänger – sei hilfsbereit und geduldig.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Sicherheit geht vor</h3>
                  <p className="text-muted-foreground text-sm">
                    Die Flugsicherheit hat immer oberste Priorität. Teile keine Inhalte, die 
                    unsichere Praktiken fördern oder verharmlosen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Konstruktiver Austausch</h3>
                  <p className="text-muted-foreground text-sm">
                    Diskutiere sachlich und konstruktiv. Kritik ist willkommen, aber sie sollte 
                    hilfreich und respektvoll formuliert sein.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Do's */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">
              ✓ Das ist erwünscht
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Teile deine Flugerfahrungen, Tipps und Wissen</li>
              <li>Stelle Fragen und hilf anderen bei ihren Fragen</li>
              <li>Organisiere Fly-Outs und Events für die Community</li>
              <li>Teile Fotos und Videos von deinen Flügen</li>
              <li>Vernetze dich mit anderen Piloten aus deiner Region</li>
              <li>Gib konstruktives Feedback und nimm es auch an</li>
              <li>Melde problematische Inhalte dem Team</li>
            </ul>
          </section>

          {/* Don'ts */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-destructive">
              ✗ Das ist verboten
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Beleidigungen und Hassrede:</strong> Diskriminierung aufgrund von 
                  Herkunft, Geschlecht, Religion, sexueller Orientierung oder anderer 
                  persönlicher Merkmale</li>
              <li><strong>Gefährliche Inhalte:</strong> Anleitungen oder Ermutigung zu 
                  unsicheren Flugpraktiken</li>
              <li><strong>Spam und Werbung:</strong> Unaufgeforderte kommerzielle Inhalte 
                  oder Eigenwerbung</li>
              <li><strong>Falschinformationen:</strong> Verbreitung von falschen oder 
                  irreführenden Informationen, besonders zu sicherheitsrelevanten Themen</li>
              <li><strong>Persönliche Angriffe:</strong> Mobbing, Stalking oder Belästigung 
                  anderer Nutzer</li>
              <li><strong>Illegale Inhalte:</strong> Alles, was gegen geltendes Recht verstößt</li>
              <li><strong>Urheberrechtsverletzungen:</strong> Teilen von Inhalten ohne 
                  entsprechende Rechte</li>
              <li><strong>Fake-Profile:</strong> Identitätsdiebstahl oder irreführende 
                  Profilangaben</li>
            </ul>
          </section>

          {/* Consequences */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Konsequenzen bei Verstößen
            </h2>
            <p className="text-muted-foreground mb-4">
              Je nach Schwere und Häufigkeit des Verstoßes behalten wir uns folgende Maßnahmen vor:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
              <li><strong>Verwarnung:</strong> Bei erstmaligen, leichten Verstößen</li>
              <li><strong>Löschung von Inhalten:</strong> Entfernung problematischer Beiträge</li>
              <li><strong>Temporäre Sperre:</strong> Zeitlich begrenzte Einschränkung der 
                  Nutzungsmöglichkeiten</li>
              <li><strong>Permanente Sperrung:</strong> Dauerhafter Ausschluss von der Plattform</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              Bei schweren Verstößen oder strafbaren Handlungen behalten wir uns vor, 
              entsprechende Behörden zu informieren.
            </p>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Meldeprozess</h2>
            <p className="text-muted-foreground">
              Wenn du einen Verstoß gegen diese Richtlinien bemerkst:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground mt-2 space-y-2">
              <li>Nutze die Meldefunktion beim betreffenden Inhalt</li>
              <li>Beschreibe kurz, was das Problem ist</li>
              <li>Unser Team prüft die Meldung zeitnah</li>
              <li>Du erhältst eine Rückmeldung über das Ergebnis</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              Alternativ kannst du uns auch direkt kontaktieren unter: 
              <a href="mailto:info@ld-solutions.de" className="text-primary hover:underline ml-1">
                info@ld-solutions.de
              </a>
            </p>
          </section>

          {/* Closing */}
          <section className="bg-muted/50 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">Gemeinsam abheben! 🛫</h2>
            <p className="text-muted-foreground">
              Diese Richtlinien helfen uns, SkyBuddy zu einem Ort zu machen, an dem sich alle 
              Piloten wohlfühlen und austauschen können. Danke, dass du Teil unserer Community 
              bist und diese Werte mit uns teilst.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Fly safe, fly together!</strong>
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            <strong>Stand:</strong> Januar 2026
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityGuidelines;
