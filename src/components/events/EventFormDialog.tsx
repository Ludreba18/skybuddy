import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, Plane, MapPin, Users, CalendarIcon, Pencil, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import AirportCombobox from "@/components/airports/AirportCombobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const eventSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen haben"),
  description: z.string().optional(),
  event_date: z.date({ required_error: "Datum ist erforderlich" }),
  event_time: z.string().min(1, "Uhrzeit ist erforderlich"),
  event_type: z.enum(["flyout", "fly_in", "stammtisch", ""], { required_error: "Event-Typ ist erforderlich" }).refine(val => val !== "", { message: "Event-Typ ist erforderlich" }),
  airport_name: z.string().optional(),
  airport_icao: z.string().optional(),
  max_participants: z.string().optional(),
});

type EventFormData = Omit<z.infer<typeof eventSchema>, 'event_type'> & {
  event_type: "flyout" | "fly_in" | "stammtisch" | "";
};

interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: "flyout" | "fly_in" | "stammtisch";
  airport_name: string | null;
  airport_icao: string | null;
  max_participants: number | null;
  image_url?: string | null;
}

interface EventFormDialogProps {
  profileId: string;
  onEventSaved: () => void;
  onEventCreated?: (eventId: string) => void;
  event?: EventData;
  trigger?: React.ReactNode;
}

const EventFormDialog = ({ profileId, onEventSaved, onEventCreated, event, trigger }: EventFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dateInputValue, setDateInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!event;

  // Parse German date format DD.MM.YYYY
  const parseDateInput = (input: string): Date | null => {
    const regex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = input.match(regex);
    if (!match) return null;
    
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate: must be a valid date and not in the past
    if (isNaN(date.getTime())) return null;
    if (date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return null;
    
    return date;
  };

  const handleDateInputChange = (value: string, fieldOnChange: (date: Date | undefined) => void) => {
    setDateInputValue(value);
    const parsedDate = parseDateInput(value);
    if (parsedDate) {
      fieldOnChange(parsedDate);
    }
  };

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      event_date: undefined,
      event_time: "10:00",
      event_type: "",
      airport_name: "",
      airport_icao: "",
      max_participants: "",
    },
  });

  // Reset form when dialog opens with event data
  useEffect(() => {
    if (open && event) {
      const eventDate = new Date(event.event_date);
      form.reset({
        title: event.title,
        description: event.description || "",
        event_date: eventDate,
        event_time: format(eventDate, "HH:mm"),
        event_type: event.event_type,
        airport_name: event.airport_name || "",
        airport_icao: event.airport_icao || "",
        max_participants: event.max_participants?.toString() || "",
      });
      setDateInputValue(format(eventDate, "dd.MM.yyyy"));
      // Set existing image preview
      if (event.image_url) {
        setImagePreview(event.image_url);
      } else {
        setImagePreview(null);
      }
      setImageFile(null);
    } else if (open && !event) {
      form.reset({
        title: "",
        description: "",
        event_date: undefined,
        event_time: "10:00",
        event_type: "",
        airport_name: "",
        airport_icao: "",
        max_participants: "",
      });
      setDateInputValue("");
      setImageFile(null);
      setImagePreview(null);
    }
  }, [open, event, form]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Datei zu groß",
          description: "Das Bild darf maximal 5MB groß sein.",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (eventId: string): Promise<string | null> => {
    if (!imageFile || !user?.id) return event?.image_url || null;
    
    const fileExt = imageFile.name.split(".").pop();
    // Use user folder pattern for storage policy compliance: userId/eventId.ext
    const fileName = `${user.id}/${eventId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("event-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // State for airport coordinates from combobox selection
  const [airportCoordinates, setAirportCoordinates] = useState<{ lat?: number; lon?: number }>({});

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      const [hours, minutes] = data.event_time.split(":");
      const eventDateTime = new Date(data.event_date);
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      let imageUrl: string | null = null;
      
      // Use coordinates from combobox selection (already from database)
      const coordinates = airportCoordinates.lat && airportCoordinates.lon 
        ? { lat: airportCoordinates.lat, lon: airportCoordinates.lon } 
        : null;

      // Type guard to ensure event_type is valid before submitting
      if (data.event_type === "") {
        throw new Error("Event-Typ ist erforderlich");
      }
      const validEventType = data.event_type as "flyout" | "fly_in" | "stammtisch";

      if (isEditing) {
        // Upload image first if there's a new one
        imageUrl = await uploadImage(event.id);
        
        const eventPayload = {
          title: data.title,
          description: data.description || null,
          event_date: eventDateTime.toISOString(),
          event_type: validEventType,
          airport_name: data.airport_name || null,
          airport_icao: data.airport_icao?.toUpperCase() || null,
          max_participants: data.max_participants ? parseInt(data.max_participants) : null,
          image_url: imagePreview === null ? null : imageUrl,
          latitude: coordinates?.lat || null,
          longitude: coordinates?.lon || null,
        };

        const { error } = await supabase
          .from("events")
          .update(eventPayload)
          .eq("id", event.id);
        if (error) throw error;
        toast({
          title: "Event aktualisiert!",
          description: "Deine Änderungen wurden gespeichert.",
        });
      } else {
        // Create event first, then upload image
        const eventPayload = {
          title: data.title,
          description: data.description || null,
          event_date: eventDateTime.toISOString(),
          event_type: validEventType,
          airport_name: data.airport_name || null,
          airport_icao: data.airport_icao?.toUpperCase() || null,
          max_participants: data.max_participants ? parseInt(data.max_participants) : null,
          organizer_id: profileId,
          is_public: true,
          latitude: coordinates?.lat || null,
          longitude: coordinates?.lon || null,
        };

        const { data: newEvent, error } = await supabase
          .from("events")
          .insert(eventPayload)
          .select("id")
          .single();
        if (error) throw error;

        // Upload image if there is one
        if (imageFile && newEvent) {
          imageUrl = await uploadImage(newEvent.id);
          await supabase
            .from("events")
            .update({ image_url: imageUrl })
            .eq("id", newEvent.id);
        }

        toast({
          title: "Event erstellt!",
          description: "Dein Event wurde erfolgreich erstellt.",
        });
        
        // Call onEventCreated callback with the new event ID
        if (newEvent && onEventCreated) {
          onEventCreated(newEvent.id);
        }
      }
      
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      setOpen(false);
      onEventSaved();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Event konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Event erstellen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 text-primary" />
                Event bearbeiten
              </>
            ) : (
              <>
                <Plane className="w-5 h-5 text-primary" />
                Neues Event erstellen
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Bearbeite die Details deines Events."
              : "Erstelle ein Fly-Out, Fly-In oder Stammtisch für die Community."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Fly-Out nach Sylt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event-Typ</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wähle einen Typ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="flyout">
                        <span className="flex items-center gap-2">
                          <Plane className="w-4 h-4" /> Fly-Out
                        </span>
                      </SelectItem>
                      <SelectItem value="fly_in">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" /> Event
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormItem>
              <FormLabel>Event-Bild (optional)</FormLabel>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Event Vorschau"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                  >
                    <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Klicke zum Hochladen</span>
                    <span className="text-xs text-muted-foreground mt-1">Max. 5MB</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beschreibe das Event..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Picker with manual input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="TT.MM.JJJJ"
                          value={dateInputValue}
                          onChange={(e) => handleDateInputChange(e.target.value, field.onChange)}
                          className="flex-1"
                        />
                      </FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" type="button">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              if (date) {
                                setDateInputValue(format(date, "dd.MM.yyyy"));
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                            locale={de}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uhrzeit</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Airport Selection */}
            <FormItem>
              <FormLabel>Flugplatz</FormLabel>
              <AirportCombobox
                value={form.watch("airport_icao")}
                onSelect={(airport) => {
                  if (airport) {
                    form.setValue("airport_icao", airport.icao);
                    form.setValue("airport_name", airport.name);
                    setAirportCoordinates({ lat: airport.lat, lon: airport.lon });
                  } else {
                    form.setValue("airport_icao", "");
                    form.setValue("airport_name", "");
                    setAirportCoordinates({});
                  }
                }}
                placeholder="Flugplatz auswählen..."
              />
              <FormDescription>
                Wähle den Zielflugplatz aus der Liste
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max. Teilnehmer</FormLabel>
                  <FormControl>
                    <Input type="number" min="2" max="100" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximale Anzahl der Teilnehmer (2-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Speichere..." : isEditing ? "Speichern" : "Event erstellen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;