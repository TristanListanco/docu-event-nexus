
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { EventType } from "@/types/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddEventPage() {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(false);
  
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  const { createEvent } = useEvents();
  const { staff, getAvailableStaff } = useStaff();
  const navigate = useNavigate();
  
  const availableStaff = date && startTime && endTime
    ? getAvailableStaff(format(date, 'yyyy-MM-dd'), startTime, endTime)
    : { videographers: [], photographers: [] };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    setLoading(true);
    
    const formattedDate = format(date, "yyyy-MM-dd");
    
    const eventData = {
      name,
      date: formattedDate,
      startTime,
      endTime,
      location,
      type,
      ignoreScheduleConflicts,
      status: "Upcoming" as const,
      videographers: selectedVideographers,
      photographers: selectedPhotographers,
      isBigEvent: false
    };
    
    const newEvent = await createEvent(eventData);
    
    if (newEvent) {
      navigate(`/events/${newEvent.id}`);
    }
    
    setLoading(false);
  };
  
  const handleVideographerChange = (staffId: string) => {
    setSelectedVideographers(prev => 
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };
  
  const handlePhotographerChange = (staffId: string) => {
    setSelectedPhotographers(prev => 
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Update available staff when date/time changes
  const updateAvailableStaff = () => {
    if (!date || !startTime || !endTime) {
      return { videographers: [], photographers: [] };
    }
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    return getAvailableStaff(formattedDate, startTime, endTime);
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/events")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Add New Event</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter event name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="Enter location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Event</SelectItem>
                    <SelectItem value="SPECOM">SPECOM</SelectItem>
                    <SelectItem value="LITCOM">LITCOM</SelectItem>
                    <SelectItem value="CUACOM">CUACOM</SelectItem>
                    <SelectItem value="SPODACOM">SPODACOM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ignoreConflicts"
                checked={ignoreScheduleConflicts}
                onCheckedChange={(checked) => 
                  setIgnoreScheduleConflicts(checked === true)
                }
              />
              <Label htmlFor="ignoreConflicts">
                Ignore schedule conflicts
              </Label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Staff Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Videographers</h3>
              {availableStaff.videographers.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableStaff.videographers.map((videographer) => (
                    <div key={videographer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`video-${videographer.id}`}
                        checked={selectedVideographers.includes(videographer.id)}
                        onCheckedChange={() => handleVideographerChange(videographer.id)}
                      />
                      <Label htmlFor={`video-${videographer.id}`} className="flex items-center">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                          {videographer.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                        {videographer.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  {date && startTime && endTime
                    ? "No videographers available for this time slot"
                    : "Select date and time to see available videographers"}
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Photographers</h3>
              {availableStaff.photographers.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableStaff.photographers.map((photographer) => (
                    <div key={photographer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`photo-${photographer.id}`}
                        checked={selectedPhotographers.includes(photographer.id)}
                        onCheckedChange={() => handlePhotographerChange(photographer.id)}
                      />
                      <Label htmlFor={`photo-${photographer.id}`} className="flex items-center">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                          {photographer.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                        {photographer.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  {date && startTime && endTime
                    ? "No photographers available for this time slot"
                    : "Select date and time to see available photographers"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/events")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !date}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
