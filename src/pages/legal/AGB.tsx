import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const AGB = () => {
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
        <h1 className="font-heading text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">§ 1 Geltungsbereich</h2>
            <p className="text-muted-foreground">
              (1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der 
              Online-Plattform "SkyBuddy" (nachfolgend "Plattform"), betrieben von LD solutions,
              Inhaber Luca Dresbach, Wengertstraße 12, 97705 Burkardroth (nachfolgend "Betreiber").
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Die Plattform richtet sich an Privatpiloten und Luftfahrtbegeisterte und dient 
              der Vernetzung, dem Austausch und der Organisation gemeinsamer Flugaktivitäten.
            </p>
            <p className="text-muted-foreground mt-2">
              (3) Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen 
              werden nicht Vertragsbestandteil, es sei denn, ihrer Geltung wird ausdrücklich 
              zugestimmt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 2 Registrierung und Vertragsschluss</h2>
            <p className="text-muted-foreground">
              (1) Die Nutzung der Plattform erfordert eine Registrierung. Mit der Registrierung 
              kommt ein Nutzungsvertrag zwischen dem Nutzer und dem Betreiber zustande.
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Die Registrierung ist nur volljährigen und voll geschäftsfähigen natürlichen 
              Personen gestattet.
            </p>
            <p className="text-muted-foreground mt-2">
              (3) Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu 
              machen und diese aktuell zu halten.
            </p>
            <p className="text-muted-foreground mt-2">
              (4) Jeder Nutzer darf nur ein Konto anlegen. Die Weitergabe von Zugangsdaten an 
              Dritte ist untersagt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 3 Leistungsbeschreibung</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Kostenlose Mitgliedschaft (Free)</h3>
            <p className="text-muted-foreground">
              Die kostenlose Mitgliedschaft umfasst:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li>Erstellung eines Pilotenprofils</li>
              <li>Ansicht von öffentlichen Events</li>
              <li>Ansicht von Forum-Beiträgen</li>
              <li>Ansicht anderer Pilotenprofile</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Premium-Mitgliedschaft</h3>
            <p className="text-muted-foreground">
              Die Premium-Mitgliedschaft umfasst zusätzlich:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li>Direktnachrichten an andere Piloten</li>
              <li>Erstellung von Events und Fly-Outs</li>
              <li>Teilnahme an Events</li>
              <li>Erstellung von Forum-Beiträgen und Kommentaren</li>
              <li>Zugang zur Pilotenkarte</li>
              <li>Erweiterte Suchfilter</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 4 Pflichten der Nutzer</h2>
            <p className="text-muted-foreground">
              (1) Der Nutzer verpflichtet sich:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li>Keine rechtswidrigen, beleidigenden, diskriminierenden oder anderweitig 
                  anstößigen Inhalte zu veröffentlichen</li>
              <li>Die Rechte Dritter, insbesondere Urheberrechte und Persönlichkeitsrechte, 
                  zu beachten</li>
              <li>Keine Werbung oder Spam zu verbreiten</li>
              <li>Die Community-Richtlinien einzuhalten</li>
              <li>Keine falschen oder irreführenden Angaben zu machen</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              (2) Der Betreiber ist berechtigt, Inhalte zu löschen oder zu sperren, die gegen 
              diese Bestimmungen verstoßen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 5 Haftungsausschluss für Flugaktivitäten</h2>
            <p className="text-muted-foreground">
              (1) Die Plattform dient ausschließlich der Vernetzung von Piloten. Der Betreiber 
              ist nicht an der Organisation oder Durchführung von Flügen beteiligt.
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Jeder Pilot ist selbst für die Einhaltung aller luftfahrtrechtlichen 
              Bestimmungen, die Überprüfung seiner Flugtauglichkeit und die sichere Durchführung 
              seiner Flüge verantwortlich.
            </p>
            <p className="text-muted-foreground mt-2">
              (3) Der Betreiber übernimmt keine Haftung für Schäden, die im Zusammenhang mit 
              über die Plattform organisierten Flugaktivitäten entstehen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 6 Urheberrechte</h2>
            <p className="text-muted-foreground">
              (1) Der Nutzer räumt dem Betreiber ein einfaches, zeitlich und räumlich 
              unbeschränktes Nutzungsrecht an allen von ihm eingestellten Inhalten ein, soweit 
              dies für den Betrieb der Plattform erforderlich ist.
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Der Nutzer versichert, dass er über alle erforderlichen Rechte an den von 
              ihm eingestellten Inhalten verfügt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 7 Haftung des Betreibers</h2>
            <p className="text-muted-foreground">
              (1) Der Betreiber haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie 
              bei Verletzung von Leben, Körper oder Gesundheit.
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Bei leichter Fahrlässigkeit haftet der Betreiber nur bei Verletzung 
              wesentlicher Vertragspflichten (Kardinalpflichten). Die Haftung ist in diesem 
              Fall auf den vorhersehbaren, vertragstypischen Schaden begrenzt.
            </p>
            <p className="text-muted-foreground mt-2">
              (3) Der Betreiber haftet nicht für Inhalte, die von Nutzern eingestellt werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 8 Kündigung</h2>
            <p className="text-muted-foreground">
              (1) Der Nutzer kann seinen Account jederzeit ohne Angabe von Gründen löschen. 
              Die Löschung erfolgt über die Profileinstellungen.
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Der Betreiber kann den Nutzungsvertrag mit einer Frist von 14 Tagen ordentlich 
              kündigen. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt 
              unberührt.
            </p>
            <p className="text-muted-foreground mt-2">
              (3) Ein wichtiger Grund liegt insbesondere vor, wenn der Nutzer gegen diese AGB 
              oder die Community-Richtlinien verstößt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 9 Änderungen der AGB</h2>
            <p className="text-muted-foreground">
              (1) Der Betreiber behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern.
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Änderungen werden dem Nutzer mindestens 30 Tage vor Inkrafttreten per E-Mail 
              mitgeteilt. Widerspricht der Nutzer nicht innerhalb dieser Frist, gelten die 
              Änderungen als angenommen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">§ 10 Schlussbestimmungen</h2>
            <p className="text-muted-foreground">
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des 
              UN-Kaufrechts.
            </p>
            <p className="text-muted-foreground mt-2">
              (2) Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder 
              öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand der 
              Sitz des Betreibers.
            </p>
            <p className="text-muted-foreground mt-2">
              (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die 
              Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
            <p className="text-muted-foreground mt-4">
              <strong>Stand:</strong> September 2026
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AGB;
