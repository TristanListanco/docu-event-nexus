import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { EventType, StaffAvailability } from "@/types/models";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Building2, Save } from "lucide-react";
import EnhancedMultiStaffSelector from "@/components/events/enhanced-multi-staff-selector";
import { getEnhancedStaffAvailability } from "@/hooks/staff/enhanced-staff-availability";

interface AddEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded?: () => void;
}

export default function AddEventSheet({ open, onOpenChange, onEventAdded }: AddEventSheetProps) {
  const { addEvent } = useEvents();
  const { staff } = useStaff();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    logId: "",
    date: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    location: "",
    organizer: "",
    type: "General" as EventType,
    ignoreScheduleConflicts: false,
    ccsOnlyEvent: false,
    isUniversityWideEvent: false,
  });

  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [timeValidationError, setTimeValidationError] = useState("");

  // Update staff availability when date/time changes
  useEffect(() => {
    if (formData.date && formData.startTime && formData.endTime) {
      const availability = getEnhancedStaffAvailability(
        staff,
        format(formData.date, 'yyyy-MM-dd'),
        formData.startTime,
        formData.endTime,
        formData.ignoreScheduleConflicts,
        formData.ccsOnlyEvent
      );
      setStaffAvailability(availability);
    }
  }, [formData.date, formData.startTime, formData.endTime, formData.ignoreScheduleConflicts, formData.ccsOnlyEvent, staff]);
  
  // Generate log ID when opening
  useEffect(() => {
    if (open) {
      const prefix = "EVNT";
      const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
      setFormData(prev => ({ ...prev, logId: `${prefix}-${randomId}` }));
    }
  }, [open]);

  // Reset form when closing
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        logId: "",
        date: undefined,
        startTime: "",
        endTime: "",
        location: "",
        organizer: "",
        type: "General",
        ignoreScheduleConflicts: false,
        ccsOnlyEvent: false,
        isUniversityWideEvent: false,
      });
      setSelectedVideographers([]);
      setSelectedPhotographers([]);
      setSubmitting(false);
      setStaffAvailability([]);
      setTimeValidationError("");
    }
  }, [open]);

  const validateTime = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (start >= end) {
      setTimeValidationError("End time must be after start time");
      return false;
    }
    
    setTimeValidationError("");
    return true;
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'startTime') {
      validateTime(value, formData.endTime);
    } else {
      validateTime(formData.startTime, value);
    }
  };

  const canSelectStaff = formData.date && formData.startTime && formData.endTime && !timeValidationError;

  const handleSubmit = async () => {
    if (!validateTime(formData.startTime, formData.endTime)) return;
    
    if (!formData.name || !formData.logId || !formData.date || !formData.startTime || !formData.endTime || !formData.location) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const eventId = await addEvent(
        {
          name: formData.name,
          logId: formData.logId,
          date: format(formData.date, 'yyyy-MM-dd'),
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          organizer: formData.organizer || undefined,
          type: formData.type,
          status: "Upcoming",
          ignoreScheduleConflicts: formData.ignoreScheduleConflicts,
          ccsOnlyEvent: formData.ccsOnlyEvent,
          isBigEvent: false,
          bigEventId: null
        },
        selectedVideographers,
        selectedPhotographers,
        false
      );

      if (eventId) {
        toast({
          title: "Event Created",
          description: "The event has been created successfully.",
        });
        onOpenChange(false);
        onEventAdded?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Fill in the event details and assign staff members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter event name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    type="time"
                    id="startTime"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    type="time"
                    id="endTime"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              {timeValidationError && (
                <p className="text-sm text-red-500">{timeValidationError}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                  placeholder="Enter organizer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={formData.type} onValueChange={(value: EventType) => setFormData(prev => ({ ...prev, type: value }))}>
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

            {/* Right Column - Date & Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Date & Options</h3>
              
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {formData.date ? format(formData.date, "MMMM dd, yyyy") : "Pick a date"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isUniversityWideEvent"
                    checked={formData.isUniversityWideEvent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUniversityWideEvent: !!checked }))}
                  />
                  <Label htmlFor="isUniversityWideEvent" className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    University Wide Event
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ignoreScheduleConflicts"
                    checked={formData.ignoreScheduleConflicts}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ignoreScheduleConflicts: !!checked }))}
                  />
                  <Label htmlFor="ignoreScheduleConflicts">Ignore schedule conflicts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ccsOnlyEvent"
                    checked={formData.ccsOnlyEvent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ccsOnlyEvent: !!checked }))}
                  />
                  <Label htmlFor="ccsOnlyEvent">CCS classes suspended</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Staff Assignment</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedMultiStaffSelector
                role="Videographer"
                staffAvailability={staffAvailability}
                selectedStaffIds={selectedVideographers}
                onSelectionChange={setSelectedVideographers}
                excludeStaffIds={selectedPhotographers}
                disabled={!canSelectStaff}
                eventStartTime={formData.startTime}
                eventEndTime={formData.endTime}
              />
              
              <EnhancedMultiStaffSelector
                role="Photographer"
                staffAvailability={staffAvailability}
                selectedStaffIds={selectedPhotographers}
                onSelectionChange={setSelectedPhotographers}
                excludeStaffIds={selectedVideographers}
                disabled={!canSelectStaff}
                eventStartTime={formData.startTime}
                eventEndTime={formData.endTime}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !!timeValidationError}
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
