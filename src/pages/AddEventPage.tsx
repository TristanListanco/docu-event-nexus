
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember, EventType } from "@/types/models";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock, Mail, GraduationCap, AlertCircle } from "lucide-react";
import MultiStaffSelector from "@/components/events/multi-staff-selector";

export default function AddEventPage() {
  const [name, setName] = useState("");
  const [logId, setLogId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [staffAvailabilityMode, setStaffAvailabilityMode] = useState("normal");
  const [sendEmailNotifications, setSendEmailNotifications] = useState(true);
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState("");
  const { addEvent } = useEvents();
  const { staff, loading: staffLoading, getAvailableStaff } = useStaff();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Store available staff
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  const [scheduleCalculated, setScheduleCalculated] = useState(false);

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

  // Check availability whenever date/time/staffAvailabilityMode changes
  useEffect(() => {
    if (date && startTime && endTime && !timeValidationError) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const ignoreScheduleConflicts = staffAvailabilityMode === "ignore";
      const ccsOnlyEvent = staffAvailabilityMode === "ccs";
      
      const { videographers, photographers } = getAvailableStaff(
        formattedDate,
        startTime,
        endTime,
        ignoreScheduleConflicts,
        ccsOnlyEvent
      );
      
      setAvailableVideographers(videographers);
      setAvailablePhotographers(photographers);
      setScheduleCalculated(true);
      
      // Reset selections if the previously selected staff members are no longer available
      const videographersStillAvailable = selectedVideographers.filter(id => 
        videographers.some(v => v.id === id)
      );
      const photographersStillAvailable = selectedPhotographers.filter(id => 
        photographers.some(p => p.id === id)
      );
      
      if (videographersStillAvailable.length !== selectedVideographers.length) {
        setSelectedVideographers(videographersStillAvailable);
      }
      
      if (photographersStillAvailable.length !== selectedPhotographers.length) {
        setSelectedPhotographers(photographersStillAvailable);
      }
    } else {
      // Reset if necessary inputs are missing
      setAvailableVideographers([]);
      setAvailablePhotographers([]);
      setScheduleCalculated(false);
    }
  }, [date, startTime, endTime, staffAvailabilityMode, staff, getAvailableStaff, selectedVideographers, selectedPhotographers, timeValidationError]);
  
  // Function to generate a unique log ID
  const generateLogId = () => {
    const prefix = "EVNT";
    const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newLogId = `${prefix}-${randomId}`;
    setLogId(newLogId);
  };

  // Generate log ID on component mount
  useEffect(() => {
    generateLogId();
  }, []);

  // Auto-set end date when multi-day is enabled
  useEffect(() => {
    if (isMultiDay && date && !endDate) {
      setEndDate(date);
    }
  }, [isMultiDay, date, endDate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!name || !logId || !date || !startTime || !endTime || !location) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Validate time
      if (!validateTime(startTime, endTime)) {
        setSubmitting(false);
        return;
      }

      const ignoreScheduleConflicts = staffAvailabilityMode === "ignore";
      const ccsOnlyEvent = staffAvailabilityMode === "ccs";

      // Format date properly to avoid timezone issues
      const formattedDate = format(date, 'yyyy-MM-dd');
      const formattedEndDate = isMultiDay && endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

      // Save the event with multiple staff assignments
      const eventId = await addEvent(
        {
          name,
          logId,
          date: formattedDate,
          endDate: formattedEndDate,
          startTime,
          endTime,
          location,
          organizer: organizer || undefined,
          type,
          status: "Upcoming", // Default status for new events
          ignoreScheduleConflicts,
          ccsOnlyEvent,
          isBigEvent: false,
          bigEventId: null // Ensure this is null not empty string
        },
        selectedVideographers,
        selectedPhotographers,
        sendEmailNotifications
      );

      // If successful, redirect to the event details page
      if (eventId) {
        navigate(`/events/${eventId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStaffAvailabilityDescription = () => {
    switch (staffAvailabilityMode) {
      case "ignore":
        return "Showing all staff members (schedule conflicts ignored)";
      case "ccs":
        return "Showing staff members available for the selected time slot (CCS classes suspended)";
      default:
        return "Showing only staff members available for the selected time slot";
    }
  };

  const canSelectStaff = date && startTime && endTime && !timeValidationError;

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Add Event</h1>
            <Button onClick={() => navigate("/events")} variant="outline">
              Cancel
            </Button>
          </div>
          <Separator className="mb-6" />
          
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Event Name"
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organizer">Organizer/s</Label>
                    <Input
                      id="organizer"
                      type="text"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      placeholder="Event Organizer/s"
                      className="w-full"
                    />
                  </div>
                  
                  {/* Multi-day toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiDay"
                      checked={isMultiDay}
                      onCheckedChange={(checked) => setIsMultiDay(!!checked)}
                    />
                    <Label htmlFor="multiDay">Multi-day event</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center" side="bottom">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {isMultiDay && (
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center" side="bottom">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) =>
                                date < (date || new Date()) || date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value);
                            validateTime(e.target.value, endTime);
                          }}
                          className={cn("pl-8", timeValidationError && "border-red-500")}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => {
                            setEndTime(e.target.value);
                            validateTime(startTime, e.target.value);
                          }}
                          className={cn("pl-8", timeValidationError && "border-red-500")}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {timeValidationError && (
                    <div className="text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {timeValidationError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Event Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Event Location"
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Event Type</Label>
                    <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPECOM">SPECOM</SelectItem>
                        <SelectItem value="LITCOM">LITCOM</SelectItem>
                        <SelectItem value="CUACOM">CUACOM</SelectItem>
                        <SelectItem value="SPODACOM">SPODACOM</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Options Section */}
                  <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                    <h3 className="text-lg font-semibold">Options</h3>
                    
                    {/* Staff Availability Mode */}
                    <div className="space-y-3">
                      <Label>Staff Availability</Label>
                      <RadioGroup
                        value={staffAvailabilityMode}
                        onValueChange={setStaffAvailabilityMode}
                        className="grid gap-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="normal" id="normal" />
                          <Label htmlFor="normal" className="font-normal">
                            Normal (respect schedule conflicts)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ignore" id="ignore" />
                          <Label htmlFor="ignore" className="font-normal">
                            Show all staff (ignore schedule conflicts)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ccs" id="ccs" />
                          <Label htmlFor="ccs" className="flex items-center font-normal">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            CCS-only Event (BCA, CCC, CSC, ISY, ITE, ITN, ITD classes suspended)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Send Email Notifications checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendEmails"
                        checked={sendEmailNotifications}
                        onCheckedChange={(checked) => setSendEmailNotifications(!!checked)}
                      />
                      <Label htmlFor="sendEmails" className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Send email notifications to assigned staff
                      </Label>
                    </div>
                  </div>
                  
                  {/* Staff Assignment Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Staff Assignment</h3>
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
                      
                      {canSelectStaff && scheduleCalculated && (
                        <p className="text-sm text-muted-foreground">
                          {getStaffAvailabilityDescription()}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MultiStaffSelector
                          role="Videographer"
                          availableStaff={availableVideographers}
                          selectedStaffIds={selectedVideographers}
                          onSelectionChange={setSelectedVideographers}
                          excludeStaffIds={selectedPhotographers}
                          disabled={!canSelectStaff}
                        />
                        
                        <MultiStaffSelector
                          role="Photographer"
                          availableStaff={availablePhotographers}
                          selectedStaffIds={selectedPhotographers}
                          onSelectionChange={setSelectedPhotographers}
                          excludeStaffIds={selectedVideographers}
                          disabled={!canSelectStaff}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit button - Sticky at bottom */}
                  <div className="sticky bottom-0 bg-background pt-4 border-t">
                    <Button type="submit" disabled={submitting || !!timeValidationError} className="w-full sm:w-auto">
                      {submitting ? "Creating Event..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
