
import { useState, useCallback, useEffect } from "react";
import { useStaff } from "@/hooks/use-staff";
import { useEvents } from "@/hooks/events/use-events";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Event, EventType } from "@/types/models";
import MultiStaffSelector from "./multi-staff-selector";
import { Calendar as CalendarIconLarge, Clock, MapPin, User, Tag, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAvailableStaff } from "@/hooks/staff/staff-availability";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: () => void;
}

// Form state interface for better type safety
interface FormState {
  name: string;
  date: Date | undefined;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  type: EventType;
  videographerIds: string[];
  photographerIds: string[];
  ignoreScheduleConflicts: boolean;
  ccsOnlyEvent: boolean;
  sendEmailNotifications: boolean;
}

const initialFormState: FormState = {
  name: "",
  date: undefined,
  startTime: "",
  endTime: "",
  location: "",
  organizer: "",
  type: "General",
  videographerIds: [],
  photographerIds: [],
  ignoreScheduleConflicts: false,
  ccsOnlyEvent: false,
  sendEmailNotifications: false,
};

// Storage key for form persistence
const FORM_STORAGE_KEY = 'add-event-form-data';

export default function AddEventDialog({ open, onOpenChange, onEventAdded }: AddEventDialogProps) {
  const { staff, loading: staffLoading } = useStaff();
  const { addEvent } = useEvents();

  // Form state - initialize from localStorage if available
  const [formState, setFormState] = useState<FormState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { 
            ...initialFormState, 
            ...parsed,
            date: parsed.date ? new Date(parsed.date) : undefined
          };
        } catch {
          return initialFormState;
        }
      }
    }
    return initialFormState;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState("");

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && open) {
      const stateToSave = {
        ...formState,
        date: formState.date?.toISOString()
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [formState, open]);

  // Helper function to update form state
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setIsSubmitting(false);
    setTimeValidationError("");
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);

  // Validate time function
  const validateTime = useCallback((startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      setTimeValidationError("");
      return true;
    }
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
      setTimeValidationError("End time must be later than start time");
      return false;
    }
    
    setTimeValidationError("");
    return true;
  }, []);

  // Get available staff for the event time, considering schedule conflicts and leave dates
  const getAvailableStaffForEvent = () => {
    if (!formState.date || !formState.startTime || !formState.endTime || timeValidationError) {
      return { videographers: [], photographers: [] };
    }

    const formattedDate = format(formState.date, 'yyyy-MM-dd');
    return getAvailableStaff(
      staff,
      formattedDate,
      formState.startTime,
      formState.endTime,
      formState.ignoreScheduleConflicts,
      formState.ccsOnlyEvent
    );
  };

  const availableStaff = getAvailableStaffForEvent();

  // Check if date and time are selected for staff selection validation
  const canSelectStaff = formState.date && formState.startTime && formState.endTime && !timeValidationError;

  // Handle time changes with validation
  const handleStartTimeChange = (value: string) => {
    updateFormState({ startTime: value });
    validateTime(value, formState.endTime);
  };

  const handleEndTimeChange = (value: string) => {
    updateFormState({ endTime: value });
    validateTime(formState.startTime, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!formState.name || !formState.date || !formState.startTime || !formState.endTime || !formState.location) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Validate time
      if (!validateTime(formState.startTime, formState.endTime)) {
        return;
      }

      // Format date properly to avoid timezone issues
      const formattedDate = format(formState.date, 'yyyy-MM-dd');

      const eventData: Omit<Event, "id" | "videographers" | "photographers"> = {
        name: formState.name,
        logId: "", // Will be generated by the hook
        date: formattedDate,
        startTime: formState.startTime,
        endTime: formState.endTime,
        location: formState.location,
        organizer: formState.organizer || null,
        type: formState.type,
        status: "Upcoming",
        ignoreScheduleConflicts: formState.ignoreScheduleConflicts,
        ccsOnlyEvent: formState.ccsOnlyEvent,
        isBigEvent: false,
        bigEventId: null
      };

      await addEvent(
        eventData,
        formState.videographerIds,
        formState.photographerIds,
        formState.sendEmailNotifications
      );

      resetForm();
      onOpenChange(false);
      onEventAdded();
    } catch (error) {
      console.error("Error adding event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Only clear form if user explicitly closes or cancels
      // Don't clear on accidental closes due to re-renders
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
          <DialogHeader className="animate-slide-in-right">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <CalendarIconLarge className="h-5 w-5 text-primary" />
              Add New Event
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
            {/* Basic Information */}
            <Card className="animate-fade-in-up">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      value={formState.name}
                      onChange={(e) => updateFormState({ name: e.target.value })}
                      placeholder="Enter event name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Event Type *</Label>
                    <Select value={formState.type} onValueChange={(value) => updateFormState({ type: value as EventType })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="SPECOM">SPECOM</SelectItem>
                        <SelectItem value="LITCOM">LITCOM</SelectItem>
                        <SelectItem value="CUACOM">CUACOM</SelectItem>
                        <SelectItem value="SPODACOM">SPODACOM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizer">Organizer</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="organizer"
                      value={formState.organizer}
                      onChange={(e) => updateFormState({ organizer: e.target.value })}
                      placeholder="Enter organizer name"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card className="animate-fade-in-up">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Date & Time</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formState.date && "text-muted-foreground"
                          )}
                        >
                          {formState.date ? format(formState.date, "MMMM dd, yyyy") : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formState.date}
                          onSelect={(date) => updateFormState({ date })}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formState.startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      required
                      className={cn(timeValidationError && "border-red-500")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formState.endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      required
                      className={cn(timeValidationError && "border-red-500")}
                    />
                  </div>
                </div>
                
                {timeValidationError && (
                  <div className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {timeValidationError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="animate-fade-in-up">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Location</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Textarea
                    id="location"
                    value={formState.location}
                    onChange={(e) => updateFormState({ location: e.target.value })}
                    placeholder="Enter event location"
                    required
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Staff Assignment */}
            <Card className="animate-fade-in-up">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Staff Assignment</h3>
                </div>
                
                {!canSelectStaff && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        {timeValidationError ? "Invalid time range" : "Date and time required"}
                      </p>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      {timeValidationError 
                        ? "Please fix the time validation error to see available staff for assignment."
                        : "Please select event date and time first to see available staff for assignment."
                      }
                    </p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <MultiStaffSelector
                    role="Videographer"
                    availableStaff={canSelectStaff ? availableStaff.videographers : []}
                    selectedStaffIds={formState.videographerIds}
                    onSelectionChange={(ids) => updateFormState({ videographerIds: ids })}
                    maxSelection={3}
                    disabled={staffLoading || !canSelectStaff}
                    excludeStaffIds={formState.photographerIds}
                  />
                  
                  <MultiStaffSelector
                    role="Photographer"
                    availableStaff={canSelectStaff ? availableStaff.photographers : []}
                    selectedStaffIds={formState.photographerIds}
                    onSelectionChange={(ids) => updateFormState({ photographerIds: ids })}
                    maxSelection={3}
                    disabled={staffLoading || !canSelectStaff}
                    excludeStaffIds={formState.videographerIds}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card className="animate-fade-in-up">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Options</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Ignore Schedule Conflicts</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow assignment even if staff has scheduling conflicts
                      </p>
                    </div>
                    <Switch
                      checked={formState.ignoreScheduleConflicts}
                      onCheckedChange={(checked) => updateFormState({ ignoreScheduleConflicts: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>CCS Only Event</Label>
                      <p className="text-sm text-muted-foreground">
                        Show only CCS staff members for assignment
                      </p>
                    </div>
                    <Switch
                      checked={formState.ccsOnlyEvent}
                      onCheckedChange={(checked) => updateFormState({ ccsOnlyEvent: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Send Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify assigned staff via email
                      </p>
                    </div>
                    <Switch
                      checked={formState.sendEmailNotifications}
                      onCheckedChange={(checked) => updateFormState({ sendEmailNotifications: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 animate-fade-in-up">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  handleOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!timeValidationError}
                className="hover-scale"
              >
                {isSubmitting ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
