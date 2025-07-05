import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EventType, StaffAvailability } from "@/types/models";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import EnhancedMultiStaffSelector from "@/components/events/enhanced-multi-staff-selector";
import { toast } from "@/hooks/use-toast";

export default function AddEventPage() {
  const navigate = useNavigate();
  const { addEvent } = useEvents();
  const { getAvailableStaff } = useStaff();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    date: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    location: "",
    organizer: "",
    type: "General" as EventType,
    ignoreScheduleConflicts: false,
    ccsOnlyEvent: false,
    isMultiDay: false,
  });

  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [timeValidationError, setTimeValidationError] = useState("");

  useEffect(() => {
    if (formData.date && formData.startTime && formData.endTime && !timeValidationError) {
      updateStaffAvailability();
    }
  }, [formData.date, formData.startTime, formData.endTime, formData.ignoreScheduleConflicts, formData.ccsOnlyEvent, timeValidationError]);

  const updateStaffAvailability = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) return;

    const availability = getAvailableStaff(
      format(formData.date, 'yyyy-MM-dd'),
      formData.startTime,
      formData.endTime,
      formData.ignoreScheduleConflicts,
      formData.ccsOnlyEvent
    );
    
    setStaffAvailability(availability);
  };

  const validateTime = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) {
      setTimeValidationError("");
      return true;
    }
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !validateTime(formData.startTime, formData.endTime)) return;
    
    setLoading(true);
    
    try {
      const success = await addEvent({
        name: formData.name,
        date: format(formData.date, 'yyyy-MM-dd'),
        endDate: formData.isMultiDay && formData.endDate 
          ? format(formData.endDate, 'yyyy-MM-dd') 
          : format(formData.date, 'yyyy-MM-dd'),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        organizer: formData.organizer,
        type: formData.type,
        ignoreScheduleConflicts: formData.ignoreScheduleConflicts,
        ccsOnlyEvent: formData.ccsOnlyEvent,
        sendEmailNotifications: false
      }, selectedVideographers, selectedPhotographers);

      if (success) {
        toast({
          title: "Event Created",
          description: "The event has been created successfully.",
        });
        navigate('/events');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStaffAvailabilityDescription = () => {
    if (formData.ignoreScheduleConflicts) {
      return "Showing all staff members (schedule conflicts ignored)";
    } else if (formData.ccsOnlyEvent) {
      return "Showing staff members available for the selected time slot (CCS classes suspended)";
    }
    return "Showing only staff members available for the selected time slot";
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/events')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
        <h1 className="text-2xl font-bold">Create New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Event Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter event name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      type="time"
                      id="startTime"
                      value={formData.startTime}
                      onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      type="time"
                      id="endTime"
                      value={formData.endTime}
                      onChange={(e) => handleTimeChange('endTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {timeValidationError && (
                  <div className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {timeValidationError}
                  </div>
                )}

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="organizer">Organizer</Label>
                  <Input
                    id="organizer"
                    value={formData.organizer}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                    placeholder="Enter organizer name"
                  />
                </div>

                <div>
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
            </div>
          </div>

          {/* Right Column - Date & Options */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Date & Options</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multiDay"
                    checked={formData.isMultiDay}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isMultiDay: !!checked }))}
                  />
                  <Label htmlFor="multiDay">Multi-day event</Label>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          {formData.date ? format(formData.date, "MMMM dd, yyyy") : "Pick a date"}
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
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {formData.isMultiDay && (
                    <div>
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.endDate && "text-muted-foreground"
                            )}
                          >
                            {formData.endDate ? format(formData.endDate, "MMMM dd, yyyy") : "Pick end date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.endDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                            disabled={(date) => !date || (formData.date && date < formData.date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
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
          </div>
        </div>

        {/* Staff Assignment Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Staff Assignment</h2>
          <div className="bg-muted/20 p-4 rounded-lg border space-y-4">
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
                    : "Please select date and time to see available staff"
                  }
                </p>
              </div>
            )}
            
            {canSelectStaff && (
              <p className="text-sm text-muted-foreground">
                {getStaffAvailabilityDescription()}
              </p>
            )}
            
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

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/events')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !formData.name || !formData.date || !formData.location || !!timeValidationError}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
