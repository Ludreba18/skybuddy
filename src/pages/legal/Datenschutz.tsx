import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Datenschutz = () => {
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
        <h1 className="font-heading text-4xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Datenschutz auf einen Blick</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Allgemeine Hinweise</h3>
            <p className="text-muted-foreground">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Datenerfassung auf dieser Website</h3>
            <p className="text-muted-foreground">
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen 
              Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Verantwortliche Stelle</h2>
            <p className="text-muted-foreground">
              LD solutions (Inhaber: Luca Dresbach)<br />
              Wengertstraße 12<br />
              97705 Burkardroth<br />
              E-Mail: info@ld-solutions.de
            </p>
            <p className="text-muted-foreground mt-4">
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder 
              gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen 
              Daten entscheidet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Welche Daten wir erheben</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Registrierungsdaten</h3>
            <p className="text-muted-foreground">
              Bei der Registrierung erfassen wir:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li>Vorname und Nachname</li>
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Zeitpunkt der Zustimmung zu AGB und Datenschutz</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Profildaten</h3>
            <p className="text-muted-foreground">
              Optional können Sie folgende Daten angeben:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li>Nickname / Rufname</li>
              <li>Profilbild und Titelbild</li>
              <li>Standort / Wohnort</li>
              <li>Heimatflughafen (ICAO-Code und Name)</li>
              <li>Flugstunden</li>
              <li>Biografie / Über mich</li>
              <li>Pilotenlizenzen (PPL, CPL, ATPL, etc.)</li>
              <li>Flugzeugtypen</li>
              <li>Interessen</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Nutzungsdaten</h3>
            <p className="text-muted-foreground">
              Während der Nutzung der Plattform entstehen:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li>Forum-Beiträge und Kommentare</li>
              <li>Private Nachrichten zwischen Nutzern</li>
              <li>Event-Teilnahmen und -Erstellungen</li>
              <li>Kontaktlisten</li>
              <li>Benachrichtigungen</li>
              <li>Letzter Aktivitätszeitpunkt</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Technische Daten</h3>
            <p className="text-muted-foreground">
              Automatisch erfasst werden:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li>IP-Adresse (anonymisiert)</li>
              <li>Browser-Typ und -Version</li>
              <li>Betriebssystem</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Rechtsgrundlagen</h2>
            <p className="text-muted-foreground">
              Die Verarbeitung Ihrer Daten erfolgt auf folgenden Rechtsgrundlagen:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung):</strong> Bei Registrierung und Cookie-Nutzung</li>
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung):</strong> Zur Bereitstellung unserer Dienste</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse):</strong> Für technisch notwendige Datenverarbeitung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Speicherdauer</h2>
            <p className="text-muted-foreground">
              Ihre Daten werden gespeichert, solange Ihr Konto aktiv ist. Nach Löschung Ihres Kontos 
              werden personenbezogene Daten innerhalb von 30 Tagen gelöscht oder anonymisiert, sofern 
              keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
            <p className="text-muted-foreground">
              Wir verwenden Cookies für:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li><strong>Notwendige Cookies:</strong> Session-Verwaltung, Authentifizierung</li>
              <li><strong>Funktionale Cookies:</strong> Speichern Ihrer Präferenzen</li>
              <li><strong>Analyse-Cookies:</strong> Nur mit Ihrer Einwilligung zur Verbesserung unseres Angebots</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Sie können Ihre Cookie-Einstellungen jederzeit über unser Cookie-Banner anpassen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Ihre Rechte</h2>
            <p className="text-muted-foreground">
              Sie haben folgende Rechte bezüglich Ihrer Daten:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
              <li><strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie können unrichtige Daten berichtigen lassen</li>
              <li><strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen</li>
              <li><strong>Einschränkung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen</li>
              <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem gängigen Format erhalten</li>
              <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung widersprechen</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Sie können diese Rechte direkt in Ihrem Profil unter "Datenschutz-Einstellungen" ausüben 
              oder uns per E-Mail kontaktieren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Datenexport und Kontolöschung</h2>
            <p className="text-muted-foreground">
              In Ihrem Profil finden Sie folgende Funktionen:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2">
              <li><strong>Datenexport:</strong> Laden Sie alle Ihre Daten als Datei herunter</li>
              <li><strong>Kontolöschung:</strong> Löschen Sie Ihr Konto und alle zugehörigen Daten unwiderruflich</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Datensicherheit</h2>
            <p className="text-muted-foreground">
              Wir verwenden SSL/TLS-Verschlüsselung für alle Datenübertragungen. Passwörter werden 
              gehashed gespeichert. Der Zugriff auf Ihre Daten ist durch Row Level Security auf 
              Datenbankebene geschützt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Beschwerderecht</h2>
            <p className="text-muted-foreground">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung 
              Ihrer personenbezogenen Daten zu beschweren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Änderungen</h2>
            <p className="text-muted-foreground">
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die aktuelle 
              Version finden Sie stets auf dieser Seite.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Stand:</strong> September 2026
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Datenschutz;
