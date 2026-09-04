import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DataExportButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!profile?.id) return;

    setIsExporting(true);

    try {
      // Collect all user data
      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        profile: {},
        licenses: [],
        aircraft: [],
        interests: [],
        posts: [],
        forumPosts: [],
        forumComments: [],
        events: [],
        eventParticipations: [],
        contacts: [],
        messages: [],
      };

      // 1. Profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single();
      exportData.profile = profileData;

      // 2. Licenses
      const { data: licenses } = await supabase
        .from("pilot_licenses")
        .select("*")
        .eq("profile_id", profile.id);
      exportData.licenses = licenses || [];

      // 3. Aircraft
      const { data: aircraft } = await supabase
        .from("pilot_aircraft")
        .select("*")
        .eq("profile_id", profile.id);
      exportData.aircraft = aircraft || [];

      // 4. Interests
      const { data: interests } = await supabase
        .from("pilot_interests")
        .select("*")
        .eq("profile_id", profile.id);
      exportData.interests = interests || [];

      // 5. Feed Posts
      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("profile_id", profile.id);
      exportData.posts = posts || [];

      // 6. Forum Posts
      const { data: forumPosts } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("author_id", profile.id);
      exportData.forumPosts = forumPosts || [];

      // 7. Forum Comments
      const { data: forumComments } = await supabase
        .from("forum_comments")
        .select("*")
        .eq("author_id", profile.id);
      exportData.forumComments = forumComments || [];

      // 8. Events created by user
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", profile.id);
      exportData.events = events || [];

      // 9. Event participations
      const { data: eventParticipations } = await supabase
        .from("event_participants")
        .select("*, events(*)")
        .eq("profile_id", profile.id);
      exportData.eventParticipations = eventParticipations || [];

      // 10. Contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("profile_id", profile.id);
      exportData.contacts = contacts || [];

      // 11. Messages (only sent by user)
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", profile.id);
      exportData.messages = messages || [];

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skybuddy-datenexport-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 3000);

      toast({
        title: "Datenexport abgeschlossen",
        description: "Deine Daten wurden als JSON-Datei heruntergeladen.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Fehler beim Export",
        description: "Beim Exportieren deiner Daten ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exportiere...
        </>
      ) : exported ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          Heruntergeladen
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Meine Daten herunterladen
        </>
      )}
    </Button>
  );
};

export default DataExportButton;
