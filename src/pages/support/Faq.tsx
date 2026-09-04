import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const faqs = [
  {
    question: "Was kostet SkyBuddy?",
    answer:
      "SkyBuddy befindet sich aktuell in der Beta-Phase. Während dieser Zeit hast du vollen und kostenlosen Zugang zu allen Features. Sobald wir genug Nutzer haben und alles rund läuft, führen wir ein Abo-Modell ein — bestehende Beta-Nutzer werden rechtzeitig informiert.",
  },
  {
    question: "Wie erstelle ich ein Konto?",
    answer:
      'Klicke auf "30 Tage gratis starten" bzw. "Jetzt registrieren" auf der Login-Seite, gib deinen Namen, deine E-Mail-Adresse und ein Passwort ein. Du bist danach sofort eingeloggt und kannst dein Pilotenprofil ausfüllen.',
  },
  {
    question: "Wie finde ich andere Piloten?",
    answer:
      'Über den Tab "Piloten" kannst du das Pilotenverzeichnis durchsuchen und nach Namen oder Flugplatz filtern. Auf jedem Profil kannst du eine Nachricht schreiben oder die Person als Kontakt hinzufügen.',
  },
  {
    question: "Wie funktionieren Gruppen?",
    answer:
      "Jeder Nutzer kann eine Gruppe gründen — öffentlich oder privat. Öffentliche Gruppen sind für alle sichtbar und man kann eine Beitrittsanfrage stellen, die der Gruppen-Admin per Chat annimmt oder ablehnt. Zu privaten Gruppen kommt man nur per Einladung. Beiträge in einer Gruppe erscheinen im Feed mit dem Gruppennamen und sind nur für Mitglieder sichtbar.",
  },
  {
    question: "Wie melde ich mich für ein Fly-Out oder Event an?",
    answer:
      'Unter "Fly-Outs & Events" findest du alle anstehenden Termine. Mit einem Klick auf "Teilnehmen" meldest du dich an. Du kannst dort auch selbst ein Event erstellen.',
  },
  {
    question: "Wie lösche ich mein Konto oder meine Daten?",
    answer:
      'Unter "Profil bearbeiten" findest du im Bereich "Datenschutz & Konto" die Möglichkeit, alle deine Daten als Datei herunterzuladen oder dein Konto samt aller Daten unwiderruflich zu löschen.',
  },
  {
    question: "Ich habe mein Passwort vergessen — was nun?",
    answer:
      'Klicke auf der Login-Seite auf "Passwort vergessen?" und gib deine E-Mail-Adresse ein. Du erhältst einen Link, mit dem du ein neues Passwort setzen kannst.',
  },
  {
    question: "Ich habe ein Problem gefunden oder eine Frage, die hier nicht beantwortet wird.",
    answer: (
      <>
        Schreib uns einfach eine Nachricht auf unserer{" "}
        <Link to="/kontakt" className="text-primary hover:underline">
          Kontaktseite
        </Link>
        .
      </>
    ),
  },
];

const Faq = () => {
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

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-heading text-4xl font-bold mb-2">Hilfe &amp; FAQ</h1>
        <p className="text-muted-foreground mb-8">
          Antworten auf die häufigsten Fragen rund um SkyBuddy.
        </p>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question} className="p-5 bg-card border border-border rounded-xl">
              <h2 className="font-semibold text-lg mb-2">{faq.question}</h2>
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Faq;
