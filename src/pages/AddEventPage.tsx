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
import { Separator } from "@/components/ui/separator";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember, EventType } from "@/types/models";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

export default function AddEventPage() {
  const [name, setName] = useState("");
  const [logId, setLogId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(false);
  const [selectedVideographer, setSelectedVideographer] = useState<string>("");
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { addEvent } = useEvents();
  const { staff, loading: staffLoading, getAvailableStaff } = useStaff();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Store available staff
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  const [scheduleCalculated, setScheduleCalculated] = useState(false);

  // Check availability whenever date/time/ignoreScheduleConflicts changes
  useEffect(() => {
    if (date && startTime && endTime) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { videographers, photographers } = getAvailableStaff(
        formattedDate,
        startTime,
        endTime,
        ignoreScheduleConflicts
      );
      
      setAvailableVideographers(videographers);
      setAvailablePhotographers(photographers);
      setScheduleCalculated(true);
      
      // Reset selections if the previously selected staff members are no longer available
      const videographerStillAvailable = videographers.some(v => v.id === selectedVideographer);
      const photographerStillAvailable = photographers.some(p => p.id === selectedPhotographer);
      
      if (!videographerStillAvailable) {
        setSelectedVideographer("");
      }
      
      if (!photographerStillAvailable) {
        setSelectedPhotographer("");
      }
    } else {
      // Reset if necessary inputs are missing
      setAvailableVideographers([]);
      setAvailablePhotographers([]);
      setScheduleCalculated(false);
    }
  }, [date, startTime, endTime, ignoreScheduleConflicts, staff, getAvailableStaff]);
  
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
      
      // Create arrays with selected staff IDs (single selection)
      const videographerIds = selectedVideographer ? [selectedVideographer] : [];
      const photographerIds = selectedPhotographer ? [selectedPhotographer] : [];

      // Save the event
      const eventId = await addEvent(
        {
          name,
          logId,
          date: date.toISOString().split('T')[0],
          startTime,
          endTime,
          location,
          type,
          status: "Upcoming", // Default status for new events
          ignoreScheduleConflicts,
          isBigEvent: false,
          bigEventId: null // Ensure this is null not empty string
        },
        videographerIds,
        photographerIds
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

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Add Event</h1>
        <Button onClick={() => navigate("/events")} variant="outline">
          Cancel
        </Button>
      </div>
      <Separator className="my-4" />
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid md:grid-cols-1 gap-4">
              {/* Name field */}
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Event Name"
                  required
                />
              </div>
            </div>
            
            {/* Date and Time fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Event Date</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
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
                <div>
                  <Label htmlFor="endTime">End Time</Label>
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
            
            {/* Location field */}
            <div>
              <Label htmlFor="location">Event Location</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event Location"
                required
              />
            </div>
            
            {/* Event type field - removed event status */}
            <div>
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
            
            {/* Ignore Schedule Conflicts checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ignoreConflicts"
                checked={ignoreScheduleConflicts}
                onCheckedChange={(checked) => setIgnoreScheduleConflicts(!!checked)}
              />
              <Label htmlFor="ignoreConflicts">Show all staff (ignore schedule conflicts)</Label>
            </div>
            
            {/* Staff Assignment Section */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-2">Staff Assignment</h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                {/* Instructions */}
                {!scheduleCalculated && (
                  <p className="text-sm text-muted-foreground">
                    Please select date and time to see available staff
                  </p>
                )}
                
                {scheduleCalculated && (
                  <p className="text-sm text-muted-foreground">
                    {ignoreScheduleConflicts 
                      ? "Showing all staff members (schedule conflicts ignored)" 
                      : "Showing only staff members available for the selected time slot"}
                  </p>
                )}
                
                {/* Videographer Selection */}
                <div>
                  <Label htmlFor="videographer">Videographer</Label>
                  <Select 
                    value={selectedVideographer} 
                    onValueChange={setSelectedVideographer}
                    disabled={!scheduleCalculated}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a videographer" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVideographers.length > 0 ? (
                        availableVideographers.map((videographer) => (
                          <SelectItem key={videographer.id} value={videographer.id}>
                            {videographer.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-videographers-available" disabled>
                          No videographers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availableVideographers.length === 0 && scheduleCalculated && (
                    <p className="text-sm text-amber-500 mt-1">
                      No videographers available for this time slot
                    </p>
                  )}
                </div>
                
                {/* Photographer Selection */}
                <div>
                  <Label htmlFor="photographer">Photographer</Label>
                  <Select 
                    value={selectedPhotographer} 
                    onValueChange={setSelectedPhotographer}
                    disabled={!scheduleCalculated}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a photographer" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePhotographers.length > 0 ? (
                        availablePhotographers.map((photographer) => (
                          <SelectItem key={photographer.id} value={photographer.id}>
                            {photographer.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-photographers-available" disabled>
                          No photographers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availablePhotographers.length === 0 && scheduleCalculated && (
                    <p className="text-sm text-amber-500 mt-1">
                      No photographers available for this time slot
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Submit button */}
            <Button type="submit" disabled={submitting} className="mt-4">
              {submitting ? "Submitting..." : "Add Event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
