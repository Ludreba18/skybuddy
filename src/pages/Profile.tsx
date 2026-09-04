import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plane,
  ArrowLeft,
  User,
  MapPin,
  Award,
  Save,
  Loader2,
  Crown,
  Calendar,
  MessageCircle,
  Edit3,
  Heart,
  Camera,
  ImageIcon,
  Shield,
} from "lucide-react";
import AirportCombobox from "@/components/airports/AirportCombobox";
import DataExportButton from "@/components/gdpr/DataExportButton";
import DeleteAccountDialog from "@/components/gdpr/DeleteAccountDialog";

const LICENSE_OPTIONS = [
  { value: "UL", label: "UL" },
  { value: "PPL_A", label: "PPL(A)" },
  { value: "LAPL", label: "LAPL" },
  { value: "CPL", label: "CPL" },
  { value: "FI", label: "FI" },
  { value: "IR", label: "IR" },
  { value: "ATPL", label: "ATPL" },
];

const INTEREST_OPTIONS = [
  "Rundflüge",
  "Reiseflüge",
  "Fotografie",
  "Fly-Outs",
  "Kunstflug",
  "Oldtimer",
  "Technik",
  "Navigation",
  "Wetterkunde",
  "Segelflug",
  "Motorflug",
  "UL-Fliegen",
  "Nachtflug",
  "IFR",
  "Ausbildung",
];

const Profile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    nickname: "",
    location: "",
    home_airport_icao: "",
    home_airport_name: "",
    flight_hours: 0,
    bio: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [aircraftTypes, setAircraftTypes] = useState<string[]>([]);
  const [newAircraft, setNewAircraft] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        nickname: profile.nickname || "",
        location: profile.location || "",
        home_airport_icao: profile.home_airport_icao || "",
        home_airport_name: profile.home_airport_name || "",
        flight_hours: profile.flight_hours || 0,
        bio: profile.bio || "",
      });
      setAvatarUrl(profile.avatar_url || null);
      setCoverImageUrl((profile as any).cover_image_url || null);
      loadPilotData();
    }
  }, [profile]);

  const loadPilotData = async () => {
    if (!profile) return;

    const [{ data: licenses }, { data: aircraft }, { data: interestsData }] = await Promise.all([
      supabase.from("pilot_licenses").select("license_type").eq("profile_id", profile.id),
      supabase.from("pilot_aircraft").select("aircraft_type").eq("profile_id", profile.id),
      supabase.from("pilot_interests").select("interest").eq("profile_id", profile.id),
    ]);

    if (licenses) {
      setSelectedLicenses(licenses.map((l) => l.license_type));
    }
    if (aircraft) {
      setAircraftTypes(aircraft.map((a) => a.aircraft_type));
    }
    if (interestsData) {
      setInterests(interestsData.map((i) => i.interest));
    }
  };

  const uploadImage = async (file: File, type: "avatar" | "cover"): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("profile-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadImage(file, "avatar");
      if (url) {
        await supabase
          .from("profiles")
          .update({ avatar_url: url })
          .eq("id", profile.id);
        
        setAvatarUrl(url);
        await refreshProfile();
        toast({
          title: "Profilbild aktualisiert",
          description: "Dein neues Profilbild wurde hochgeladen.",
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Fehler",
        description: "Das Profilbild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploadingCover(true);
    try {
      const url = await uploadImage(file, "cover");
      if (url) {
        await supabase
          .from("profiles")
          .update({ cover_image_url: url } as any)
          .eq("id", profile.id);
        
        setCoverImageUrl(url);
        await refreshProfile();
        toast({
          title: "Titelbild aktualisiert",
          description: "Dein neues Titelbild wurde hochgeladen.",
        });
      }
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast({
        title: "Fehler",
        description: "Das Titelbild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          nickname: formData.nickname,
          location: formData.location,
          home_airport_icao: formData.home_airport_icao,
          home_airport_name: formData.home_airport_name,
          flight_hours: formData.flight_hours,
          bio: formData.bio,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // These three child-table syncs are independent of each other, so run them
      // in parallel instead of one after another - cuts save time roughly 3x.
      await Promise.all([
        (async () => {
          await supabase.from("pilot_licenses").delete().eq("profile_id", profile.id);
          if (selectedLicenses.length > 0) {
            const licenseInserts = selectedLicenses.map((license) => ({
              profile_id: profile.id,
              license_type: license as "UL" | "PPL_A" | "LAPL" | "CPL" | "FI" | "IR" | "ATPL",
            }));
            await supabase.from("pilot_licenses").insert(licenseInserts);
          }
        })(),
        (async () => {
          await supabase.from("pilot_aircraft").delete().eq("profile_id", profile.id);
          if (aircraftTypes.length > 0) {
            const aircraftInserts = aircraftTypes.map((aircraft) => ({
              profile_id: profile.id,
              aircraft_type: aircraft,
            }));
            await supabase.from("pilot_aircraft").insert(aircraftInserts);
          }
        })(),
        (async () => {
          await supabase.from("pilot_interests").delete().eq("profile_id", profile.id);
          if (interests.length > 0) {
            const interestInserts = interests.map((interest) => ({
              profile_id: profile.id,
              interest: interest,
            }));
            await supabase.from("pilot_interests").insert(interestInserts);
          }
        })(),
      ]);

      await refreshProfile();

      toast({
        title: "Profil gespeichert",
        description: "Deine Änderungen wurden erfolgreich übernommen.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Fehler",
        description: "Das Profil konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLicense = (license: string) => {
    setSelectedLicenses((prev) =>
      prev.includes(license)
        ? prev.filter((l) => l !== license)
        : [...prev, license]
    );
  };

  const addAircraft = () => {
    if (newAircraft.trim() && !aircraftTypes.includes(newAircraft.trim())) {
      setAircraftTypes([...aircraftTypes, newAircraft.trim().toUpperCase()]);
      setNewAircraft("");
    }
  };

  const removeAircraft = (aircraft: string) => {
    setAircraftTypes(aircraftTypes.filter((a) => a !== aircraft));
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Plane className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const isPremium = profile.membership_tier === "premium";
  const displayName = formData.nickname || `${formData.first_name} ${formData.last_name}`.trim() || "Pilot";

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />

      {/* Cover Image & Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20 relative overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/20" />
          )}
          
          {/* Cover Upload Button */}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-background transition-colors"
          >
            {isUploadingCover ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            Titelbild ändern
          </button>

          {/* Back Button */}
          <Link
            to="/dashboard"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg hover:bg-background transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Edit Button */}
          <div className="absolute top-4 right-4">
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/80 backdrop-blur-sm"
                  onClick={() => setIsEditing(false)}
                >
                  Abbrechen
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Speichern
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4" />
                Bearbeiten
              </Button>
            )}
          </div>
        </div>

        {/* Profile Avatar - Overlapping */}
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="relative -mt-16 md:-mt-20 mb-4">
            <div className="relative inline-block">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-card border-4 border-background shadow-lg overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <User className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                  </div>
                )}
              </div>
              
              {/* Avatar Upload Button */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Name & Premium Badge */}
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl md:text-3xl font-bold">
                  {displayName}
                </h1>
                {isPremium && (
                  <Badge className="bg-accent text-accent-foreground">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              {!isEditing && formData.location && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {formData.location}
                </p>
              )}
              {!isEditing && formData.bio && (
                <p className="text-muted-foreground mt-2">{formData.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-8 max-w-3xl">
        {/* Quick Stats - Only show when not editing */}
        {!isEditing && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Flugstunden</span>
              </div>
              <p className="font-heading text-2xl font-bold">
                {formData.flight_hours || 0}h
              </p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Heimatflugplatz</span>
              </div>
              <p className="font-heading text-lg font-bold truncate">
                {formData.home_airport_icao || "–"}
              </p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Events</span>
              </div>
              <p className="font-heading text-2xl font-bold">0</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Nachrichten</span>
              </div>
              <p className="font-heading text-2xl font-bold">0</p>
            </div>
          </div>
        )}

        {/* Licenses, Aircraft & Interests - View Mode */}
        {!isEditing && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold">Lizenzen</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedLicenses.length > 0 ? (
                  selectedLicenses.map((license) => (
                    <Badge key={license} variant="secondary">
                      {LICENSE_OPTIONS.find(l => l.value === license)?.label || license}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Keine Lizenzen hinterlegt</span>
                )}
              </div>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Plane className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold">Flugzeugtypen</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aircraftTypes.length > 0 ? (
                  aircraftTypes.map((aircraft) => (
                    <Badge key={aircraft} variant="secondary">
                      {aircraft}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Keine Flugzeugtypen hinterlegt</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interests - View Mode */}
        {!isEditing && (
          <div className="bg-card rounded-xl p-5 border border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold">Interessen</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.length > 0 ? (
                interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">Keine Interessen hinterlegt</span>
              )}
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="space-y-6">
            {/* Personal Info */}
            <section className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-bold">Persönliche Daten</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="z.B. SkyWalker"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Standort</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="z.B. München, Bayern"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="bio">Über mich</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Erzähle etwas über dich..."
                  rows={3}
                />
              </div>
            </section>

            {/* Aviation Info */}
            <section className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-bold">Flugdaten</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heimatflugplatz</Label>
                  <AirportCombobox
                    value={formData.home_airport_icao}
                    onSelect={(airport) => {
                      if (airport) {
                        setFormData({
                          ...formData,
                          home_airport_icao: airport.icao,
                          home_airport_name: airport.name,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          home_airport_icao: "",
                          home_airport_name: "",
                        });
                      }
                    }}
                    placeholder="Flugplatz auswählen..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightHours">Flugstunden</Label>
                  <Input
                    id="flightHours"
                    type="number"
                    value={formData.flight_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, flight_hours: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                  />
                </div>
              </div>
            </section>

            {/* Licenses */}
            <section className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-bold">Lizenzen</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {LICENSE_OPTIONS.map((license) => (
                  <button
                    key={license.value}
                    onClick={() => toggleLicense(license.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedLicenses.includes(license.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {license.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Aircraft */}
            <section className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-bold">Flugzeugtypen</h2>
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  value={newAircraft}
                  onChange={(e) => setNewAircraft(e.target.value)}
                  placeholder="z.B. C172, PA-28"
                  onKeyPress={(e) => e.key === "Enter" && addAircraft()}
                />
                <Button variant="outline" onClick={addAircraft}>
                  Hinzufügen
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {aircraftTypes.map((aircraft) => (
                  <span
                    key={aircraft}
                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    {aircraft}
                    <button
                      onClick={() => removeAircraft(aircraft)}
                      className="hover:text-destructive transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {aircraftTypes.length === 0 && (
                  <p className="text-muted-foreground text-sm">Noch keine Flugzeugtypen hinzugefügt</p>
                )}
              </div>
            </section>

            {/* Interests - Only predefined options, no custom */}
            <section className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-bold">Interessen</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Wähle deine Interessen aus:
              </p>

              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      interests.includes(interest)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              {interests.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Ausgewählt:</p>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* GDPR / Privacy Section */}
            <section className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-bold">Datenschutz & Konto</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Hier kannst du deine Daten herunterladen oder dein Konto dauerhaft löschen. 
                Diese Funktionen entsprechen deinen Rechten gemäß DSGVO.
              </p>

              <div className="space-y-4">
                {/* Data Export */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Datenexport</p>
                    <p className="text-sm text-muted-foreground">
                      Lade alle deine gespeicherten Daten als JSON-Datei herunter.
                    </p>
                  </div>
                  <DataExportButton />
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive">Konto löschen</p>
                    <p className="text-sm text-muted-foreground">
                      Lösche dein Konto und alle Daten unwiderruflich.
                    </p>
                  </div>
                  <DeleteAccountDialog userEmail={profile?.email} />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Weitere Informationen findest du in unserer{" "}
                  <Link to="/datenschutz" className="text-primary hover:underline">
                    Datenschutzerklärung
                  </Link>.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
