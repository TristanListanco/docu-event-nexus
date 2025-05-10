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
import { Listbox } from '@headlessui/react'

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
            <div>
              <Label>Videographers</Label>
              <Listbox value={selectedVideographers} onChange={setSelectedVideographers} multiple>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                    <span className="block truncate">
                      {selectedVideographers.length > 0
                        ? selectedVideographers.map((person) => person.name).join(', ')
                        : 'Select Videographers'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {videographers.map((person) => (
                      <Listbox.Option
                        key={person.id}
                        className={({ active }) =>
                          cn(
                            'relative cursor-default select-none py-2 pl-10 pr-4',
                            active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                          )
                        }
                        value={person}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {person.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div>
              <Label>Photographers</Label>
              <Listbox value={selectedPhotographers} onChange={setSelectedPhotographers} multiple>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                    <span className="block truncate">
                      {selectedPhotographers.length > 0
                        ? selectedPhotographers.map((person) => person.name).join(', ')
                        : 'Select Photographers'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {photographers.map((person) => (
                      <Listbox.Option
                        key={person.id}
                        className={({ active }) =>
                          cn(
                            'relative cursor-default select-none py-2 pl-10 pr-4',
                            active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                          )
                        }
                        value={person}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {person.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Add Event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
