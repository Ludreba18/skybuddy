import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
}

const COOKIE_CONSENT_KEY = "skybuddy_cookie_consent";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const acceptNecessary = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
    };
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold">Cookie-Einstellungen</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Wir verwenden Cookies, um dein Erlebnis auf SkyBuddy zu verbessern. 
            Du kannst selbst entscheiden, welche Cookies du zulassen möchtest.
          </p>
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t"
        >
          <span>Cookie-Kategorien anzeigen</span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Cookie Categories */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          showDetails ? "max-h-80" : "max-h-0"
        )}>
          <div className="px-6 py-4 space-y-4 border-t bg-muted/30">
            {/* Necessary */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Notwendige Cookies</Label>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Immer aktiv
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Erforderlich für grundlegende Funktionen wie Anmeldung und Navigation.
                </p>
              </div>
              <Switch checked={true} disabled className="opacity-50" />
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-medium">Funktionale Cookies</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Speichern deine Präferenzen wie Sprache und Theme-Einstellungen.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, functional: checked })
                }
              />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-medium">Analyse-Cookies</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Helfen uns zu verstehen, wie Nutzer die Plattform verwenden.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 border-t space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="flex-1"
            >
              Nur notwendige
            </Button>
            <Button
              onClick={showDetails ? saveCustom : acceptAll}
              variant="hero"
              className="flex-1"
            >
              {showDetails ? "Auswahl speichern" : "Alle akzeptieren"}
            </Button>
          </div>

          {/* Privacy Link */}
          <p className="text-xs text-center text-muted-foreground">
            Mehr Informationen in unserer{" "}
            <Link 
              to="/datenschutz" 
              className="text-primary hover:underline"
              onClick={() => setShowBanner(false)}
            >
              Datenschutzerklärung
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

// Export helper function to check consent
export const getCookieConsent = (): CookiePreferences | null => {
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!consent) return null;
  try {
    const parsed = JSON.parse(consent);
    return {
      necessary: parsed.necessary ?? true,
      functional: parsed.functional ?? false,
      analytics: parsed.analytics ?? false,
    };
  } catch {
    return null;
  }
};

// Export function to reset consent (for settings page)
export const resetCookieConsent = () => {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.location.reload();
};
