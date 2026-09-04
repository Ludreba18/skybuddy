# SkyBuddy

Piloten-Netzwerk-Community: Profile mit Lizenzen/Flugzeugtypen, Piloten-Verzeichnis,
Activity-Feed, Events/Fly-Outs, Forum, 1:1-Nachrichten, Premium-Abo via PayPal.

React + Vite + TypeScript + shadcn-ui + Tailwind, Backend auf Supabase (eigenes Projekt,
kein Lovable mehr).

## Setup

```bash
npm install
npm run dev
```

Läuft danach unter http://localhost:8080. `.env` mit den eigenen Supabase-Werten
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`) ist
bereits vorhanden.

## Projektstruktur

```
src/
  pages/                 Routen (Dashboard, Profile, Events, Pilots, Messages, Forum, Account, ...)
  components/            UI-Komponenten (shadcn/ui in components/ui, Feature-Komponenten sonst)
  hooks/                 Supabase-Queries/-Mutations
  integrations/supabase/ Supabase-Client + generierte DB-Typen
supabase/
  migrations/            SQL-Schema (Tabellen, RLS, Trigger, Storage-Policies)
  functions/             Edge Functions (PayPal-Integration)
e2e/                     Playwright-Tests
```

## Nächste Schritte

Aktuell in Arbeit: Flugplatz-Bewertungen (neues Feature) und eine modulare Bezahlschranke
(Preis/Umfang als Daten statt Code-Konstanten).
