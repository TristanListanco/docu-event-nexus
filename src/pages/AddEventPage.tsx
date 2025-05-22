
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [isBigEvent, setIsBigEvent] = useState(false);
  const [bigEventId, setBigEventId] = useState("");
  const [selectedVideographers, setSelectedVideographers] = useState<StaffMember[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<StaffMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { addEvent } = useEvents();
  const { staff, getStaffByRole } = useStaff();
  const { toast } = useToast();
  const navigate = useNavigate();

  const videographers = getStaffByRole("Videographer");
  const photographers = getStaffByRole("Photographer");

  const [selectedStaff, setSelectedStaff] = useState<{
    videographers: StaffMember[];
    photographers: StaffMember[];
  }>({
    videographers: [],
    photographers: [],
  });

  useEffect(() => {
    setSelectedStaff({
      videographers: selectedVideographers,
      photographers: selectedPhotographers,
    });
  }, [selectedVideographers, selectedPhotographers]);
  
  // Function to generate a unique log ID
  const generateLogId = () => {
    const prefix = "EVNT";
    const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newLogId = `${prefix}-${randomId}`;
    setLogId(newLogId);
  };

  // Toggle selection of videographer
  const toggleVideographer = (videographer: StaffMember) => {
    if (selectedVideographers.some(v => v.id === videographer.id)) {
      setSelectedVideographers(prev => prev.filter(v => v.id !== videographer.id));
    } else {
      setSelectedVideographers(prev => [...prev, videographer]);
    }
  };

  // Toggle selection of photographer
  const togglePhotographer = (photographer: StaffMember) => {
    if (selectedPhotographers.some(p => p.id === photographer.id)) {
      setSelectedPhotographers(prev => prev.filter(p => p.id !== photographer.id));
    } else {
      setSelectedPhotographers(prev => [...prev, photographer]);
    }
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
      
      // Create arrays of just the IDs
      const videographerIds = selectedVideographers.map(v => v.id);
      const photographerIds = selectedPhotographers.map(p => p.id);

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
          isBigEvent,
          bigEventId
        },
        videographerIds,
        photographerIds
      );

      // If successful, redirect to the event details page
      if (eventId) {
        navigate(`/events/${eventId}`);
        
        // Update selected staff
        setSelectedStaff({
          videographers: selectedVideographers,
          photographers: selectedPhotographers
        });
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
            
            {/* Checkboxes */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ignoreConflicts"
                checked={ignoreScheduleConflicts}
                onCheckedChange={(checked) => setIgnoreScheduleConflicts(!!checked)}
              />
              <Label htmlFor="ignoreConflicts">Ignore Schedule Conflicts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBigEvent"
                checked={isBigEvent}
                onCheckedChange={(checked) => setIsBigEvent(!!checked)}
              />
              <Label htmlFor="isBigEvent">Is Big Event</Label>
            </div>
            
            {/* Big Event ID (conditional) */}
            {isBigEvent && (
              <div>
                <Label htmlFor="bigEventId">Big Event ID</Label>
                <Input
                  id="bigEventId"
                  type="text"
                  value={bigEventId}
                  onChange={(e) => setBigEventId(e.target.value)}
                  placeholder="Big Event ID"
                />
              </div>
            )}
            
            {/* Videographers selection */}
            <div>
              <Label className="block mb-2">Videographers</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                {videographers.length > 0 ? (
                  videographers.map((person) => (
                    <div key={person.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`video-${person.id}`} 
                        checked={selectedVideographers.some(v => v.id === person.id)} 
                        onCheckedChange={() => toggleVideographer(person)}
                      />
                      <label 
                        htmlFor={`video-${person.id}`} 
                        className="flex items-center cursor-pointer text-sm"
                      >
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </span>
                        {person.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No videographers available</p>
                )}
              </div>
            </div>
            
            {/* Photographers selection */}
            <div>
              <Label className="block mb-2">Photographers</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                {photographers.length > 0 ? (
                  photographers.map((person) => (
                    <div key={person.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`photo-${person.id}`} 
                        checked={selectedPhotographers.some(p => p.id === person.id)} 
                        onCheckedChange={() => togglePhotographer(person)}
                      />
                      <label 
                        htmlFor={`photo-${person.id}`} 
                        className="flex items-center cursor-pointer text-sm"
                      >
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </span>
                        {person.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No photographers available</p>
                )}
              </div>
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
