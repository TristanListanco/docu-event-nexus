import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
}

export default function EventEditDialog({ open, onOpenChange, event, onEventUpdated }: EventEditDialogProps) {
  const { staff, loading: staffLoading } = useStaff();
  const { updateEvent } = useEvents();
  
  // Form state
  const [formData, setFormData] = useState({
    name: event.name,
    date: new Date(event.date),
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    organizer: event.organizer || "",
    type: event.type,
    videographerIds: event.videographers?.map(v => v.staffId) || [],
    photographerIds: event.photographers?.map(p => p.staffId) || [],
    ignoreScheduleConflicts: event.ignoreScheduleConflicts,
    ccsOnlyEvent: event.ccsOnlyEvent,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState("");
  const [sendEmailNotifications, setSendEmailNotifications] = useState(false);

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        date: new Date(event.date),
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        organizer: event.organizer || "",
        type: event.type,
        videographerIds: event.videographers?.map(v => v.staffId) || [],
        photographerIds: event.photographers?.map(p => p.staffId) || [],
        ignoreScheduleConflicts: event.ignoreScheduleConflicts,
        ccsOnlyEvent: event.ccsOnlyEvent,
      });
      setSendEmailNotifications(false);
    }
  }, [event]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Validate time function
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

  // Get available staff for the event time
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

  // Handle time changes with validation
  const handleStartTimeChange = (value: string) => {
    updateFormData({ startTime: value });
    validateTime(value, formData.endTime);
  };

  const handleEndTimeChange = (value: string) => {
    updateFormData({ endTime: value });
    validateTime(formData.startTime, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!formData.name || !formData.date || !formData.startTime || !formData.endTime || !formData.location) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Validate time
      if (!validateTime(formData.startTime, formData.endTime)) {
        return;
      }

      // Format date properly
      const formattedDate = format(formData.date, 'yyyy-MM-dd');

      const eventData: Partial<Event> = {
        name: formData.name,
        date: formattedDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        organizer: formData.organizer || null,
        type: formData.type,
        ignoreScheduleConflicts: formData.ignoreScheduleConflicts,
        ccsOnlyEvent: formData.ccsOnlyEvent,
      };

      await updateEvent(
        event.id,
        { ...eventData, sendEmailNotifications },
        formData.videographerIds,
        formData.photographerIds
      );

      onOpenChange(false);
      onEventUpdated();
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl lg:max-w-4xl h-[95vh] sm:h-[90vh] p-0 gap-0">
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl font-semibold">
            <CalendarIconLarge className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">Edit Event</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-3 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6 py-3 sm:py-4 lg:py-6">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="font-medium text-sm sm:text-base">Basic Information</h3>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm">Event Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="Enter event name"
                      required
                      className="w-full text-sm sm:text-base"
                    />
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="type" className="text-xs sm:text-sm">Event Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => updateFormData({ type: value as EventType })}>
                      <SelectTrigger className="w-full text-sm sm:text-base">
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

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="organizer" className="text-xs sm:text-sm">Organizer</Label>
                    <div className="relative">
                      <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="organizer"
                        value={formData.organizer}
                        onChange={(e) => updateFormData({ organizer: e.target.value })}
                        placeholder="Enter organizer name"
                        className="pl-8 sm:pl-10 w-full text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="font-medium text-sm sm:text-base">Date & Time</h3>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal text-xs sm:text-sm",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          {formData.date ? format(formData.date, "MMMM dd, yyyy") : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-3 w-3 sm:h-4 sm:w-4 opacity-50 flex-shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => updateFormData({ date })}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="startTime" className="text-xs sm:text-sm">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        required
                        className={cn(
                          timeValidationError && "border-red-500", 
                          "w-full text-xs sm:text-sm"
                        )}
                      />
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="endTime" className="text-xs sm:text-sm">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        required
                        className={cn(
                          timeValidationError && "border-red-500", 
                          "w-full text-xs sm:text-sm"
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {timeValidationError && (
                  <div className="text-xs sm:text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{timeValidationError}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="font-medium text-sm sm:text-base">Location</h3>
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="location" className="text-xs sm:text-sm">Location *</Label>
                  <Textarea
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateFormData({ location: e.target.value })}
                    placeholder="Enter event location"
                    required
                    rows={2}
                    className="w-full resize-none text-xs sm:text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Staff Assignment */}
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <User className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="font-medium text-sm sm:text-base">Staff Assignment</h3>
                </div>
                
                {!canSelectStaff && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2 text-amber-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium">
                          {timeValidationError ? "Invalid time range" : "Date and time required"}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {timeValidationError 
                            ? "Please fix the time validation error to see available staff for assignment."
                            : "Please select event date and time first to see available staff for assignment."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 sm:space-y-6">
                  <MultiStaffSelector
                    role="Videographer"
                    availableStaff={canSelectStaff ? availableStaff.videographers : []}
                    selectedStaffIds={formData.videographerIds}
                    onSelectionChange={(ids) => updateFormData({ videographerIds: ids })}
                    maxSelection={3}
                    disabled={staffLoading || !canSelectStaff}
                    excludeStaffIds={formData.photographerIds}
                  />
                  
                  <MultiStaffSelector
                    role="Photographer"
                    availableStaff={canSelectStaff ? availableStaff.photographers : []}
                    selectedStaffIds={formData.photographerIds}
                    onSelectionChange={(ids) => updateFormData({ photographerIds: ids })}
                    maxSelection={3}
                    disabled={staffLoading || !canSelectStaff}
                    excludeStaffIds={formData.videographerIds}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="font-medium text-sm sm:text-base">Options</h3>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <Label className="text-xs sm:text-sm font-medium">Ignore Schedule Conflicts</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow assignment even if staff has scheduling conflicts
                      </p>
                    </div>
                    <Switch
                      checked={formData.ignoreScheduleConflicts}
                      onCheckedChange={(checked) => updateFormData({ ignoreScheduleConflicts: checked })}
                      className="flex-shrink-0"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <Label className="text-xs sm:text-sm font-medium">CCS Only Event</Label>
                      <p className="text-xs text-muted-foreground">
                        Show only CCS staff members for assignment
                      </p>
                    </div>
                    <Switch
                      checked={formData.ccsOnlyEvent}
                      onCheckedChange={(checked) => updateFormData({ ccsOnlyEvent: checked })}
                      className="flex-shrink-0"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <Label className="text-xs sm:text-sm font-medium">Send Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify assigned staff via email
                      </p>
                    </div>
                    <Switch
                      checked={sendEmailNotifications}
                      onCheckedChange={setSendEmailNotifications}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </ScrollArea>

        {/* Fixed Footer */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6 py-2 sm:py-3 lg:py-4">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !!timeValidationError}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {isSubmitting ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
