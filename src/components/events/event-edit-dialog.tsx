
import { useState, useEffect } from "react";
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
import { CalendarIcon, Save, Trash2, Building2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, EventType, StaffAvailability } from "@/types/models";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { getEnhancedStaffAvailability } from "@/hooks/staff/enhanced-staff-availability";
import { supabase } from "@/integrations/supabase/client";
import EnhancedMultiStaffSelector from "./enhanced-multi-staff-selector";
import { getEventStatus } from "./event-status-utils";

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

export default function EventEditDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
  onEventDeleted
}: EventEditDialogProps) {
  const { updateEvent, deleteEvent } = useEvents();
  const { staff } = useStaff();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: event.name,
    date: new Date(event.date.replace(/-/g, '/')),
    endDate: event.endDate ? new Date(event.endDate.replace(/-/g, '/')) : undefined,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    organizer: event.organizer || "",
    type: event.type,
    ignoreScheduleConflicts: event.ignoreScheduleConflicts,
    ccsOnlyEvent: event.ccsOnlyEvent,
    isMultiDay: !!event.endDate,
    status: event.status,
    isUniversityWideEvent: false // Default to false, could be derived from existing data if needed
  });

  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [confirmedVideographers, setConfirmedVideographers] = useState<string[]>([]);
  const [confirmedPhotographers, setConfirmedPhotographers] = useState<string[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [timeValidationError, setTimeValidationError] = useState("");
  const [leaveDates, setLeaveDates] = useState<any[]>([]);

  const isCancelled = event.status === "Cancelled";
  const currentStatus = getEventStatus(event);
  const isElapsed = currentStatus === "Elapsed";
  const isReadOnly = isCancelled || isElapsed;

  useEffect(() => {
    if (open && event) {
      // Extract current staff assignments
      const videographerIds = event.videographers?.map(v => v.staffId) || [];
      const photographerIds = event.photographers?.map(p => p.staffId) || [];
      
      // Extract confirmed staff (those who cannot be removed)
      const confirmedVids = event.videographers
        ?.filter(v => v.confirmationStatus === 'confirmed')
        .map(v => v.staffId) || [];
      const confirmedPhotos = event.photographers
        ?.filter(p => p.confirmationStatus === 'confirmed')
        .map(p => p.staffId) || [];
      
      setSelectedVideographers(videographerIds);
      setSelectedPhotographers(photographerIds);
      setConfirmedVideographers(confirmedVids);
      setConfirmedPhotographers(confirmedPhotos);
      
      // Determine if this might be a university wide event based on staff count
      const totalStaff = videographerIds.length + photographerIds.length;
      setFormData(prev => ({
        ...prev,
        isUniversityWideEvent: totalStaff > 6 // Assume it's university wide if more than 6 staff
      }));
      
      // Calculate staff availability
      updateStaffAvailability();
    }
  }, [open, event]);

  useEffect(() => {
    if (formData.date && formData.startTime && formData.endTime) {
      updateStaffAvailability();
    }
  }, [formData.date, formData.startTime, formData.endTime, formData.ignoreScheduleConflicts, formData.ccsOnlyEvent, leaveDates]);

  // Load leave dates
  useEffect(() => {
    const loadLeaveDates = async () => {
      try {
        const { data } = await supabase
          .from('leave_dates')
          .select('*');
        setLeaveDates(data || []);
      } catch (error) {
        console.error('Error loading leave dates:', error);
      }
    };

    if (open) {
      loadLeaveDates();
    }
  }, [open]);

  const updateStaffAvailability = () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !staff) return;

    const availability = getEnhancedStaffAvailability(
      staff,
      format(formData.date, 'yyyy-MM-dd'),
      formData.startTime,
      formData.endTime,
      formData.ignoreScheduleConflicts,
      formData.ccsOnlyEvent,
      leaveDates
    );
    
    setStaffAvailability(availability);
  };

  const validateTime = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true; // Allow empty values
    
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
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (field === 'startTime') {
      validateTime(value, formData.endTime);
    } else {
      validateTime(formData.startTime, value);
    }
  };

  const canSelectStaff = formData.date && formData.startTime && formData.endTime && !timeValidationError;

  const handleSave = async () => {
    if (!validateTime(formData.startTime, formData.endTime)) return;
    
    setLoading(true);
    try {
      const success = await updateEvent(event.id, {
        name: formData.name,
        date: format(formData.date, 'yyyy-MM-dd'),
        endDate: format(formData.date, 'yyyy-MM-dd'),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        organizer: formData.organizer,
        type: formData.type,
        ignoreScheduleConflicts: formData.ignoreScheduleConflicts,
        ccsOnlyEvent: formData.ccsOnlyEvent,
        status: formData.status
      }, selectedVideographers, selectedPhotographers);

      if (success) {
        onEventUpdated?.();
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setLoading(true);
      try {
        const success = await deleteEvent(event.id);
        if (success) {
          onEventDeleted?.();
          onOpenChange(false);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {isReadOnly 
                ? `View Event (${isCancelled ? 'Cancelled' : 'Elapsed'})` 
                : 'Edit Event'
              }
            </span>
            {isCancelled && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReadOnly 
              ? `This event has been ${isCancelled ? 'cancelled' : 'completed'} and cannot be edited.`
              : 'Make changes to the event details and staff assignments.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className={cn("space-y-6", isReadOnly && "opacity-50 pointer-events-none")}>
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
                  disabled={isReadOnly}
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
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    type="time"
                    id="endTime"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    disabled={isReadOnly}
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
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                  placeholder="Enter organizer name"
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={formData.type} onValueChange={(value: EventType) => setFormData(prev => ({ ...prev, type: value }))} disabled={isReadOnly}>
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
                    <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={isReadOnly}>
                      {formData.date ? format(formData.date, "MMMM dd, yyyy") : "Pick a date"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || isReadOnly}
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="ignoreScheduleConflicts">Ignore schedule conflicts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ccsOnlyEvent"
                    checked={formData.ccsOnlyEvent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ccsOnlyEvent: !!checked }))}
                    disabled={isReadOnly}
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
                excludeStaffIds={[...selectedPhotographers, ...confirmedVideographers]}
                disabled={!canSelectStaff || isReadOnly}
                eventStartTime={formData.startTime}
                eventEndTime={formData.endTime}
              />
              
              <EnhancedMultiStaffSelector
                role="Photographer"
                staffAvailability={staffAvailability}
                selectedStaffIds={selectedPhotographers}
                onSelectionChange={setSelectedPhotographers}
                excludeStaffIds={[...selectedVideographers, ...confirmedPhotographers]}
                disabled={!canSelectStaff || isReadOnly}
                eventStartTime={formData.startTime}
                eventEndTime={formData.endTime}
              />
            </div>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !!timeValidationError}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
