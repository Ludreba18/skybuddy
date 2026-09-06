import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Bitte gib eine gültige E-Mail-Adresse ein");
const passwordSchema = z.string().min(6, "Passwort muss mindestens 6 Zeichen haben");
const usernameSchema = z.string().min(2, "Username muss mindestens 2 Zeichen haben");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (!isLogin) {
      try {
        usernameSchema.parse(username);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.username = e.errors[0].message;
        }
      }
      if (!acceptedTerms) {
        newErrors.terms = "Du musst den AGB und der Datenschutzerklärung zustimmen";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0].message });
      }
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setResetSent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Anmeldung fehlgeschlagen",
              description: "E-Mail oder Passwort ist falsch.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Fehler",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Willkommen zurück!",
            description: "Du wurdest erfolgreich angemeldet."
          });
          navigate("/dashboard");
        }
      } else {
        const { error, needsEmailConfirmation } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Registrierung fehlgeschlagen",
              description: "Diese E-Mail-Adresse ist bereits registriert.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Fehler",
              description: error.message,
              variant: "destructive"
            });
          }
        } else if (needsEmailConfirmation) {
          // No active session yet - the account exists but needs the email
          // confirmation link to be clicked first, so stay put and explain
          // instead of navigating to a dashboard that requires a logged-in user.
          setSignupEmailSent(true);
        } else {
          // GDPR consent timestamps are now set automatically by the handle_new_user trigger
          toast({
            title: "Willkommen bei SkyBuddy!",
            description: "Dein Konto wurde erstellt. Du bist jetzt angemeldet."
          });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (signupEmailSent) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-white">SkyBuddy</span>
          </div>
          <div className="glass-card rounded-2xl p-8 space-y-4">
            <h1 className="font-heading text-2xl font-bold">Fast geschafft!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Wir haben dir eine E-Mail an <strong>{email}</strong> geschickt. Bitte bestätige
              deine Adresse über den Link darin, um dich anzumelden.
            </p>
            <button
              type="button"
              onClick={() => {
                setSignupEmailSent(false);
                setIsLogin(true);
              }}
              className="text-primary hover:underline font-medium"
            >
              Zurück zum Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      {/* Back button */}
      <a
        href="/"
        className="absolute top-4 left-4 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück zur Startseite
      </a>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-white">
              SkyBuddy
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">
            {forgotMode ? "Passwort zurücksetzen" : isLogin ? "Willkommen zurück" : "Werde Teil der Community"}
          </h1>
          <p className="text-white/70">
            {forgotMode
              ? "Gib deine E-Mail-Adresse ein, wir schicken dir einen Link"
              : isLogin
              ? "Melde dich an, um weiterzufliegen"
              : "Erstelle dein kostenloses Pilotenprofil"}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8">
          {forgotMode ? (
            resetSent ? (
              <div className="text-center space-y-5 py-2">
                <p className="text-foreground leading-relaxed">
                  Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link
                  zum Zurücksetzen deines Passworts geschickt.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setResetSent(false);
                    setErrors({});
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Zurück zum Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-foreground">
                    E-Mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="pilot@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    "Link zum Zurücksetzen senden"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setErrors({});
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
                >
                  Zurück zum Login
                </button>
              </form>
            )
          ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="SkyWalker"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`pl-10 ${errors.username ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                E-Mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="pilot@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Passwort
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
              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setErrors({});
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Passwort vergessen?
                  </button>
                </div>
              )}
            </div>

            {/* Terms Checkbox - Only for Registration */}
            {!isLogin && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className={errors.terms ? "border-destructive" : ""}
                  />
                  <Label 
                    htmlFor="terms" 
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    Ich habe die{" "}
                    <Link 
                      to="/agb" 
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      AGB
                    </Link>{" "}
                    und die{" "}
                    <Link 
                      to="/datenschutz" 
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      Datenschutzerklärung
                    </Link>{" "}
                    gelesen und stimme diesen zu.
                  </Label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-destructive">{errors.terms}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading || (!isLogin && !acceptedTerms)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bitte warten...
                </>
              ) : isLogin ? (
                "Anmelden"
              ) : (
                "Registrieren"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setAcceptedTerms(false);
                }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Jetzt registrieren" : "Anmelden"}
              </button>
            </p>
          </div>
          </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-sm mt-8">
          Fly together. Share the sky. ✈️
        </p>
      </div>
    </div>
  );
};

export default Auth;
