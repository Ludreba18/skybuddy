import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Check, LogOut, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Subscribe = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, signOut } = useAuth();
  const { hasActiveAccess } = useAccessStatus();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  // If user has active access (trial or premium), redirect to account page
  useEffect(() => {
    if (!loading && hasActiveAccess) {
      navigate("/account");
    }
  }, [loading, hasActiveAccess, navigate]);

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast.info("Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.");
    }
    if (searchParams.get("error") === "processing") {
      toast.error("Es gab ein Problem bei der Verarbeitung. Bitte kontaktiere den Support.");
    }
  }, [searchParams]);

  const handlePayPalSubscribe = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error("Bitte melde dich erneut an.");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Erstellen des Abonnements");
      }

      if (data.approvalUrl) {
        // Redirect to PayPal
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("Keine PayPal-URL erhalten");
      }
    } catch (error) {
      console.error("PayPal subscription error:", error);
      toast.error("Fehler beim Starten der Zahlung. Bitte versuche es erneut.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Plane className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  const features = [
    "Unbegrenzter Zugang zur Piloten-Community",
    "Events & Fly-Outs erstellen und teilnehmen",
    "Private Nachrichten mit anderen Piloten",
    "Forum-Beiträge und Kommentare",
    "Flugfotos und -erlebnisse teilen",
    "Erweiterte Piloten-Suche",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg">SkyBuddy</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full space-y-8">
          {/* Trial Expired Message */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold">
              Deine Testphase ist abgelaufen
            </h1>
            <p className="text-muted-foreground">
              Hallo {profile?.first_name || "Pilot"}! Dein 30-tägiger kostenloser Testzeitraum ist leider vorbei. 
              Werde jetzt Mitglied, um weiterhin Teil der SkyBuddy-Community zu sein.
            </p>
          </div>

          {/* Subscription Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">SkyBuddy Mitgliedschaft</CardTitle>
              <CardDescription>Voller Zugang zu allen Features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price */}
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">9,99 €</span>
                  <span className="text-muted-foreground">/ Monat</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Jederzeit kündbar
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* PayPal Button */}
              <Button 
                className="w-full h-12 text-base bg-[#0070ba] hover:bg-[#003087] text-white" 
                size="lg"
                onClick={handlePayPalSubscribe}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.235 4.85-1.647 7.584-6.334 7.584H12.09c-.524 0-.968.382-1.05.9l-1.12 7.107-.315 2.003a.64.64 0 0 0 .633.74h4.137c.457 0 .847-.331.919-.779l.038-.193.728-4.612.047-.255a.922.922 0 0 1 .91-.78h.573c3.71 0 6.612-1.505 7.46-5.857.345-1.769.167-3.242-.694-4.317z"/>
                    </svg>
                    Mit PayPal bezahlen
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Sichere Zahlung über PayPal. Nach der Zahlung wird dein Zugang sofort freigeschaltet.
              </p>
            </CardContent>
          </Card>

          {/* Help Link */}
          <p className="text-center text-sm text-muted-foreground">
            Fragen? Schreib uns an{" "}
            <a href="mailto:info@ld-solutions.de" className="text-primary hover:underline">
              info@ld-solutions.de
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Subscribe;
