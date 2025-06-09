
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember, EventType } from "@/types/models";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock, Mail, GraduationCap } from "lucide-react";
import MultiStaffSelector from "@/components/events/multi-staff-selector";

interface AddEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded?: () => void;
}

export default function AddEventSheet({ open, onOpenChange, onEventAdded }: AddEventSheetProps) {
  const [name, setName] = useState("");
  const [logId, setLogId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
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
  const { addEvent } = useEvents();
  const { staff, loading: staffLoading, getAvailableStaff } = useStaff();
  const { toast } = useToast();

  // Store available staff
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  const [scheduleCalculated, setScheduleCalculated] = useState(false);

  // Check availability whenever date/time/staffAvailabilityMode changes
  useEffect(() => {
    if (date && startTime && endTime) {
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
      setAvailableVideographers([]);
      setAvailablePhotographers([]);
      setScheduleCalculated(false);
    }
  }, [date, startTime, endTime, staffAvailabilityMode, staff, getAvailableStaff, selectedVideographers, selectedPhotographers]);
  
  // Function to generate a unique log ID
  const generateLogId = () => {
    const prefix = "EVNT";
    const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newLogId = `${prefix}-${randomId}`;
    setLogId(newLogId);
  };

  // Generate log ID on component mount and when sheet opens
  useEffect(() => {
    if (open) {
      generateLogId();
    }
  }, [open]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setName("");
      setLogId("");
      setDate(undefined);
      setStartTime("");
      setEndTime("");
      setLocation("");
      setOrganizer("");
      setType("General");
      setStaffAvailabilityMode("normal");
      setSendEmailNotifications(true);
      setSelectedVideographers([]);
      setSelectedPhotographers([]);
      setSubmitting(false);
      setAvailableVideographers([]);
      setAvailablePhotographers([]);
      setScheduleCalculated(false);
    }
  }, [open]);

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
      
      if (new Date(`${date.toISOString().split('T')[0]}T${endTime}`) <= new Date(`${date.toISOString().split('T')[0]}T${startTime}`)) {
        toast({
          title: "Invalid Time",
          description: "End time must be later than start time.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const ignoreScheduleConflicts = staffAvailabilityMode === "ignore";
      const ccsOnlyEvent = staffAvailabilityMode === "ccs";

      // Save the event with multiple staff assignments
      const eventId = await addEvent(
        {
          name,
          logId,
          date: date.toISOString().split('T')[0],
          startTime,
          endTime,
          location,
          organizer: organizer || undefined,
          type,
          status: "Upcoming",
          ignoreScheduleConflicts,
          ccsOnlyEvent,
          isBigEvent: false,
          bigEventId: null
        },
        selectedVideographers,
        selectedPhotographers,
        sendEmailNotifications
      );

      if (eventId) {
        toast({
          title: "Event Created",
          description: "The event has been created successfully.",
        });
        onOpenChange(false);
        onEventAdded?.();
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Add New Event</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-1">
          <form onSubmit={handleSubmit} className="space-y-4 pb-20">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
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
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event Date *</Label>
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
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-8"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-8"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Event Location *</Label>
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
            <div className="space-y-4 p-3 bg-muted/20 rounded-lg border">
              <h3 className="text-base font-semibold">Options</h3>
              
              {/* Staff Availability Mode */}
              <div className="space-y-3">
                <Label>Staff Availability</Label>
                <RadioGroup
                  value={staffAvailabilityMode}
                  onValueChange={setStaffAvailabilityMode}
                  className="grid gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal" className="font-normal text-sm">
                      Normal (respect schedule conflicts)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ignore" id="ignore" />
                    <Label htmlFor="ignore" className="font-normal text-sm">
                      Show all staff (ignore schedule conflicts)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ccs" id="ccs" />
                    <Label htmlFor="ccs" className="flex items-center font-normal text-sm">
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
                <Label htmlFor="sendEmails" className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send email notifications to assigned staff
                </Label>
              </div>
            </div>
            
            {/* Staff Assignment Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Staff Assignment</h3>
              <div className="bg-muted/20 p-3 rounded-lg border space-y-4">
                {!scheduleCalculated && (
                  <p className="text-sm text-muted-foreground">
                    Please select date and time to see available staff
                  </p>
                )}
                
                {scheduleCalculated && (
                  <p className="text-sm text-muted-foreground">
                    {getStaffAvailabilityDescription()}
                  </p>
                )}
                
                <div className="space-y-4">
                  <MultiStaffSelector
                    role="Videographer"
                    availableStaff={availableVideographers}
                    selectedStaffIds={selectedVideographers}
                    onSelectionChange={setSelectedVideographers}
                    disabled={!scheduleCalculated}
                    excludeStaffIds={selectedPhotographers}
                  />
                  
                  <MultiStaffSelector
                    role="Photographer"
                    availableStaff={availablePhotographers}
                    selectedStaffIds={selectedPhotographers}
                    onSelectionChange={setSelectedPhotographers}
                    disabled={!scheduleCalculated}
                    excludeStaffIds={selectedVideographers}
                  />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>
        
        {/* Fixed Submit button at bottom */}
        <div className="border-t pt-4 flex justify-end gap-2 bg-background">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={(e) => {
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true }));
              }
            }}
            disabled={submitting}
          >
            {submitting ? "Creating Event..." : "Create Event"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
