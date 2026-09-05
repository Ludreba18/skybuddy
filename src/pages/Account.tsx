import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus, PAYWALL_ENABLED } from "@/hooks/useAccessStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plane, Crown, Clock, CreditCard, ArrowLeft, Loader2, Gift, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { hasActiveAccess, daysRemaining, isInTrial, isPremium } = useAccessStatus();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error("Bitte melde dich erneut an.");
        return;
      }

      // Note: In a real implementation, you'd store the subscription ID
      // For now, we'll update the profile directly
      const { error } = await supabase
        .from("profiles")
        .update({
          membership_tier: "free",
          membership_expires_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Dein Abonnement wurde gekündigt.");
      window.location.reload();
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Fehler beim Kündigen. Bitte kontaktiere den Support.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    setIsSubscribing(true);
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
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("Keine PayPal-URL erhalten");
      }
    } catch (error) {
      console.error("PayPal subscription error:", error);
      toast.error("Fehler beim Starten der Zahlung. Bitte versuche es erneut.");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Plane className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg">SkyBuddy</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold mb-8">Konto & Abonnement</h1>

        {/* Current Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Aktueller Status</CardTitle>
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : isInTrial ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Gift className="w-3 h-3 mr-1" />
                  Testphase
                </Badge>
              ) : !PAYWALL_ENABLED ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Gift className="w-3 h-3 mr-1" />
                  Beta-Zugang
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <Clock className="w-3 h-3 mr-1" />
                  Abgelaufen
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPremium && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium">Premium-Mitglied</p>
                  <p className="text-sm text-muted-foreground">
                    Du hast vollen Zugang zu allen Features.
                  </p>
                </div>
              </div>
            )}

            {isInTrial && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Testphase aktiv</p>
                  <p className="text-sm text-muted-foreground">
                    Noch <strong>{daysRemaining} Tage</strong> kostenloser Zugang
                    {profile?.trial_ends_at && (
                      <> bis zum {format(new Date(profile.trial_ends_at), "d. MMMM yyyy", { locale: de })}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {!hasActiveAccess && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
                <Clock className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Zugang abgelaufen</p>
                  <p className="text-sm text-muted-foreground">
                    Deine Testphase ist beendet. Werde jetzt Mitglied!
                  </p>
                </div>
              </div>
            )}

            {!PAYWALL_ENABLED && !isPremium && !isInTrial && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                <Gift className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Beta-Phase aktiv</p>
                  <p className="text-sm text-muted-foreground">
                    Du hast aktuell vollen und kostenlosen Zugang zu allen Features.
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-Mail</span>
                <span>{profile?.email || user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mitglied seit</span>
                <span>
                  {profile?.created_at
                    ? format(new Date(profile.created_at), "d. MMMM yyyy", { locale: de })
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Verwalte deine SkyBuddy-Mitgliedschaft
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Info */}
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">9,99 €</span>
                <span className="text-muted-foreground">/ Monat</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Jederzeit kündbar • Sichere Zahlung via PayPal
              </p>
            </div>

            {/* Actions based on status */}
            {isPremium ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Du bist aktuell Premium-Mitglied. Möchtest du dein Abonnement kündigen?
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                      Abonnement kündigen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Abonnement wirklich kündigen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Nach der Kündigung verlierst du sofort den Zugang zu allen Premium-Features.
                        Du kannst dich jederzeit wieder anmelden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Wird gekündigt...
                          </>
                        ) : (
                          "Ja, kündigen"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : !PAYWALL_ENABLED ? (
              <p className="text-sm text-muted-foreground text-center">
                Während der Beta-Phase ist keine Zahlung erforderlich.
              </p>
            ) : (
              <div className="space-y-4">
                {isInTrial && (
                  <p className="text-sm text-muted-foreground">
                    Sichere dir jetzt deine Mitgliedschaft und behalte den vollen Zugang nach Ablauf der Testphase.
                  </p>
                )}
                <Button
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#003087] text-white"
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Wird verarbeitet...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.235 4.85-1.647 7.584-6.334 7.584H12.09c-.524 0-.968.382-1.05.9l-1.12 7.107-.315 2.003a.64.64 0 0 0 .633.74h4.137c.457 0 .847-.331.919-.779l.038-.193.728-4.612.047-.255a.922.922 0 0 1 .91-.78h.573c3.71 0 6.612-1.505 7.46-5.857.345-1.769.167-3.242-.694-4.317z"/>
                      </svg>
                      {isInTrial ? "Jetzt Mitglied werden" : "Mit PayPal bezahlen"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Link */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Fragen zum Abonnement?{" "}
          <a href="mailto:info@ld-solutions.de" className="text-primary hover:underline">
            Kontaktiere unseren Support
          </a>
        </p>
        <p className="text-center text-xs text-muted-foreground/60 mt-2">
          SkyBuddy v{__APP_VERSION__}
        </p>
      </main>
    </div>
  );
};

export default Account;
