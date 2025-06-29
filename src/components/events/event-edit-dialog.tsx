
import { useState, useEffect } from "react";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, EventType } from "@/types/models";
import { Checkbox } from "@/components/ui/checkbox";
import MultiStaffSelector from "@/components/events/multi-staff-selector";
import { getAvailableStaff } from "@/hooks/staff/staff-availability";

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
}

export default function EventEditDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
}: EventEditDialogProps) {
  const { updateEvent } = useEvents();
  const { staff } = useStaff();
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    name: "",
    date: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    location: "",
    organizer: "",
    type: "General" as EventType,
    ignoreScheduleConflicts: false,
    ccsOnlyEvent: false,
    sendEmailNotifications: true,
  });
  
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState("");

  useEffect(() => {
    if (open && event) {
      setFormData({
        name: event.name,
        date: event.date ? new Date(event.date) : undefined,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        organizer: event.organizer || "",
        type: event.type,
        ignoreScheduleConflicts: event.ignoreScheduleConflicts || false,
        ccsOnlyEvent: event.ccsOnlyEvent || false,
        sendEmailNotifications: true,
      });

      // Set selected staff - ensure unique IDs only
      const videographerIds = Array.from(new Set(event.videographers?.map(v => v.staffId) || []));
      const photographerIds = Array.from(new Set(event.photographers?.map(p => p.staffId) || []));
      
      setSelectedVideographers(videographerIds);
      setSelectedPhotographers(photographerIds);
      setTimeValidationError("");
    }
  }, [open, event?.id]);

  const validateTime = (startTime: string, endTime: string) => {
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate time when either time field changes
    if (name === 'startTime' || name === 'endTime') {
      const newFormData = { ...formData, [name]: value };
      validateTime(newFormData.startTime, newFormData.endTime);
    }
  };

  const handleSelectChange = (value: EventType) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!event) {
        throw new Error("Event data is not available.");
      }

      // Validate form data
      if (!formData.name || !formData.date || !formData.startTime || !formData.endTime || !formData.location) {
        alert("Please fill in all required fields.");
        return;
      }

      // Validate time
      if (!validateTime(formData.startTime, formData.endTime)) {
        return;
      }

      // Format date properly to avoid timezone issues
      const formattedDate = format(formData.date, 'yyyy-MM-dd');

      // Update event with controlled email sending
      await updateEvent(
        event.id,
        {
          name: formData.name,
          date: formattedDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          organizer: formData.organizer,
          type: formData.type,
          ignoreScheduleConflicts: formData.ignoreScheduleConflicts,
          ccsOnlyEvent: formData.ccsOnlyEvent,
          sendEmailNotifications: formData.sendEmailNotifications,
        },
        selectedVideographers,
        selectedPhotographers
      );

      // Notify parent and close dialog
      onEventUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available staff for the event time, considering schedule conflicts and leave dates
  const getAvailableStaffForEvent = () => {
    if (!formData.date || !formData.startTime || !formData.endTime || timeValidationError) {
      return { videographers: [], photographers: [] };
    }

    const formattedDate = format(formData.date, 'yyyy-MM-dd');
    return getAvailableStaff(
      staff,
      formattedDate,
      formData.startTime,
      formData.endTime,
      formData.ignoreScheduleConflicts,
      formData.ccsOnlyEvent
    );
  };

  const availableStaff = getAvailableStaffForEvent();
  const canSelectStaff = formData.date && formData.startTime && formData.endTime && !timeValidationError;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            type="text"
            id="edit-name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
                id="edit-date"
              >
                {formData.date ? format(formData.date, "MMMM dd, yyyy") : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-startTime">Start Time</Label>
          <Input
            type="time"
            id="edit-startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            required
            className={cn(timeValidationError && "border-red-500")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-endTime">End Time</Label>
          <Input
            type="time"
            id="edit-endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
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

      <div className="space-y-2">
        <Label htmlFor="edit-location">Location</Label>
        <Input
          type="text"
          id="edit-location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-organizer">Organizer</Label>
        <Textarea
          id="edit-organizer"
          name="organizer"
          value={formData.organizer}
          onChange={handleInputChange}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-type">Type</Label>
        <Select onValueChange={handleSelectChange} value={formData.type}>
          <SelectTrigger id="edit-type">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit-ignoreScheduleConflicts"
            checked={formData.ignoreScheduleConflicts}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ignoreScheduleConflicts: !!checked }))}
          />
          <Label htmlFor="edit-ignoreScheduleConflicts" className="text-sm">Ignore Conflicts</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit-ccsOnlyEvent"
            checked={formData.ccsOnlyEvent}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ccsOnlyEvent: !!checked }))}
          />
          <Label htmlFor="edit-ccsOnlyEvent" className="text-sm">CCS Only Event</Label>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="edit-sendEmailNotifications"
          checked={formData.sendEmailNotifications}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendEmailNotifications: !!checked }))}
        />
        <Label htmlFor="edit-sendEmailNotifications" className="text-sm">Send email notifications to assigned staff</Label>
      </div>

      {!canSelectStaff && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">
              {timeValidationError ? "Invalid time range" : "Complete date and time required"}
            </p>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            {timeValidationError 
              ? "Please fix the time validation error to see available staff for assignment."
              : "Please ensure event date and time are properly set to see available staff for assignment."
            }
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Videographers</Label>
          <MultiStaffSelector
            role="Videographer"
            availableStaff={canSelectStaff ? availableStaff.videographers : []}
            selectedStaffIds={selectedVideographers}
            onSelectionChange={setSelectedVideographers}
            excludeStaffIds={selectedPhotographers}
            maxSelection={3}
            disabled={!canSelectStaff}
          />
        </div>

        <div className="space-y-2">
          <Label>Photographers</Label>
          <MultiStaffSelector
            role="Photographer"
            availableStaff={canSelectStaff ? availableStaff.photographers : []}
            selectedStaffIds={selectedPhotographers}
            onSelectionChange={setSelectedPhotographers}
            excludeStaffIds={selectedVideographers}
            maxSelection={3}
            disabled={!canSelectStaff}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting || !!timeValidationError}>
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );

  const dialogContent = (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>Edit Event</SheetTitle>
              <SheetDescription>
                Make changes to your event here. Email notifications can be controlled via checkbox.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(100%-8rem)] py-4">
              {formContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Make changes to your event here. Email notifications can be controlled via checkbox.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              {formContent}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  return dialogContent;
}
