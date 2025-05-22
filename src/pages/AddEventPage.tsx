
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
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
import { StaffMember, EventType, EventStatus } from "@/types/models";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export default function AddEventPage() {
  const [name, setName] = useState("");
  const [logId, setLogId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [status, setStatus] = useState<EventStatus>("Upcoming");
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(false);
  const [selectedVideographer, setSelectedVideographer] = useState<string>("");
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { addEvent } = useEvents();
  const { staff, getStaffByRole } = useStaff();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get available staff
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  
  // Function to update available staff based on date/time and ignore conflicts setting
  useEffect(() => {
    if (date && startTime && endTime) {
      // If ignoring conflicts, get all staff members by role
      if (ignoreScheduleConflicts) {
        setAvailableVideographers(getStaffByRole("Videographer"));
        setAvailablePhotographers(getStaffByRole("Photographer"));
      } else {
        // Only show staff members available for that date/time
        // In a real app, this would check for availability based on the selected date/time
        // For now, we'll just show all staff members, but in a real scenario you would filter 
        // based on conflicts with their schedules
        setAvailableVideographers(getStaffByRole("Videographer"));
        setAvailablePhotographers(getStaffByRole("Photographer"));
      }
    } else {
      // Reset if date/time not selected
      setAvailableVideographers([]);
      setAvailablePhotographers([]);
    }
  }, [date, startTime, endTime, ignoreScheduleConflicts]);
  
  // Function to generate a unique log ID
  const generateLogId = () => {
    const prefix = "EVNT";
    const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newLogId = `${prefix}-${randomId}`;
    setLogId(newLogId);
  };

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
        return;
      }
      
      if (new Date(`${date.toISOString().split('T')[0]}T${endTime}`) <= new Date(`${date.toISOString().split('T')[0]}T${startTime}`)) {
        toast({
          title: "Invalid Time",
          description: "End time must be later than start time.",
          variant: "destructive",
        });
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
          status,
          ignoreScheduleConflicts,
          isBigEvent: false, // We removed this option as requested
          bigEventId: "" // Empty since we removed the Big Event option
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
            <div className="grid md:grid-cols-2 gap-4">
              {/* Name and Log ID fields */}
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
              <div>
                <Label htmlFor="logId">Event Log ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="logId"
                    type="text"
                    value={logId}
                    onChange={(e) => setLogId(e.target.value)}
                    placeholder="Event Log ID"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateLogId}>
                    Generate
                  </Button>
                </div>
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
                        date < new Date()
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
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
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
            
            {/* Event type and status */}
            <div className="grid md:grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="status">Event Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as EventStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Ignore Schedule Conflicts checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ignoreConflicts"
                checked={ignoreScheduleConflicts}
                onCheckedChange={(checked) => setIgnoreScheduleConflicts(!!checked)}
              />
              <Label htmlFor="ignoreConflicts">Ignore Schedule Conflicts</Label>
            </div>
            
            {/* Videographer Selection */}
            <div>
              <Label htmlFor="videographer">Videographer</Label>
              <Select 
                value={selectedVideographer} 
                onValueChange={setSelectedVideographer}
                disabled={availableVideographers.length === 0}
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
                    <SelectItem value="" disabled>
                      No videographers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableVideographers.length === 0 && date && startTime && endTime && (
                <p className="text-sm text-muted-foreground mt-1">
                  No videographers available for this time slot
                </p>
              )}
              {(!date || !startTime || !endTime) && (
                <p className="text-sm text-muted-foreground mt-1">
                  Please select date and time to see available staff
                </p>
              )}
            </div>
            
            {/* Photographer Selection */}
            <div>
              <Label htmlFor="photographer">Photographer</Label>
              <Select 
                value={selectedPhotographer} 
                onValueChange={setSelectedPhotographer}
                disabled={availablePhotographers.length === 0}
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
                    <SelectItem value="" disabled>
                      No photographers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availablePhotographers.length === 0 && date && startTime && endTime && (
                <p className="text-sm text-muted-foreground mt-1">
                  No photographers available for this time slot
                </p>
              )}
            </div>
            
            {/* Submit button */}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Add Event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
