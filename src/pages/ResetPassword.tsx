import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const passwordSchema = z.string().min(6, "Passwort muss mindestens 6 Zeichen haben");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // The recovery link redirects here with the token in the URL. Older-style
    // links put it in the hash (#access_token=...&type=recovery) and
    // supabase-js picks that up automatically, firing PASSWORD_RECOVERY once
    // the session is established. Supabase's current default email template
    // instead puts it in the query string as token_hash+type, which needs an
    // explicit verifyOtp call - handle both so a template change on the
    // Supabase side can't silently break this page again.
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    if (tokenHash && type === "recovery") {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(({ error }) => {
        if (error) {
          toast({
            title: "Link ungültig",
            description: "Dieser Link ist abgelaufen oder wurde bereits verwendet.",
            variant: "destructive"
          });
        } else {
          setIsReady(true);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.password = err.errors[0].message;
      }
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "Die Passwörter stimmen nicht überein";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setDone(true);
      toast({
        title: "Passwort geändert",
        description: "Dein Passwort wurde erfolgreich aktualisiert."
      });
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <a
        href="/"
        className="absolute top-4 left-4 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück zur Startseite
      </a>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-white">SkyBuddy</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">
            Neues Passwort
          </h1>
          <p className="text-white/70">
            Vergib ein neues Passwort für dein Konto
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {done ? (
            <div className="text-center space-y-5 py-2">
              <p className="text-foreground leading-relaxed">
                Dein Passwort wurde erfolgreich geändert.
              </p>
              <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/auth")}>
                Zum Login
              </Button>
            </div>
          ) : !isReady ? (
            <div className="text-center space-y-4 py-6">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Der Link wird geprüft. Falls hier nichts passiert, ist der Link
                vermutlich abgelaufen — fordere über die Login-Seite einen neuen an.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Neues Passwort
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-foreground">
                  Passwort bestätigen
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className={`pl-10 ${errors.passwordConfirm ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.passwordConfirm && (
                  <p className="text-sm text-destructive">{errors.passwordConfirm}</p>
                )}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  "Passwort speichern"
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-white/50 text-sm mt-8">
          Fly together. Share the sky. ✈️
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
