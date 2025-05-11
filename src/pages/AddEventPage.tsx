
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useStaff } from "@/hooks/use-staff";
import { useEvents } from "@/hooks/use-events";
import { EventType } from "@/types/models";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddEventPage() {
  const navigate = useNavigate();
  const { staff, getAvailableStaff } = useStaff();
  const { createEvent } = useEvents();
  
  // Event form state
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Staff selection state
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  
  // Get available staff based on selected date and time
  const getAvailableStaffMembers = () => {
    if (!date || !startTime || !endTime) {
      return {
        videographers: [],
        photographers: []
      };
    }
    
    if (ignoreScheduleConflicts) {
      // If ignoring conflicts, show all staff
      const videographers = staff.filter(s => s.role === 'Videographer');
      const photographers = staff.filter(s => s.role === 'Photographer');
      return { videographers, photographers };
    }
    
    return getAvailableStaff(format(date, 'yyyy-MM-dd'), startTime, endTime);
  };
  
  // Toggle staff selection
  const toggleVideographer = (staffId: string) => {
    setSelectedVideographers(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId) 
        : [...prev, staffId]
    );
  };
  
  const togglePhotographer = (staffId: string) => {
    setSelectedPhotographers(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId) 
        : [...prev, staffId]
    );
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !startTime || !endTime || !name || !location) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const eventData = {
        name,
        date: format(date, 'yyyy-MM-dd'),
        startTime,
        endTime,
        location,
        type,
        status: "Upcoming" as const,
        videographers: selectedVideographers,
        photographers: selectedPhotographers,
        ignoreScheduleConflicts
      };
      
      await createEvent(eventData);
      navigate("/events");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset staff selections when date/time changes
  const resetStaffSelections = () => {
    setSelectedVideographers([]);
    setSelectedPhotographers([]);
  };
  
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    resetStaffSelections();
  };
  
  const handleTimeChange = (field: "start" | "end", value: string) => {
    if (field === "start") {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
    resetStaffSelections();
  };
  
  const handleIgnoreConflictsChange = (checked: boolean) => {
    setIgnoreScheduleConflicts(checked);
    resetStaffSelections();
  };
  
  const { videographers, photographers } = getAvailableStaffMembers();
  
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
                  placeholder="Enter event name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as EventType)}
                >
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
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter event location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ignore-conflicts"
                checked={ignoreScheduleConflicts}
                onCheckedChange={(checked) => handleIgnoreConflictsChange(checked === true)}
              />
              <Label htmlFor="ignore-conflicts">
                Ignore staff schedule conflicts
              </Label>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
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
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleTimeChange("start", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange("end", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Staff Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Videographers</h3>
              
              {videographers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {videographers.map((videographer) => (
                    <div key={videographer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`video-${videographer.id}`}
                        checked={selectedVideographers.includes(videographer.id)}
                        onCheckedChange={() => toggleVideographer(videographer.id)}
                      />
                      <Label
                        htmlFor={`video-${videographer.id}`}
                        className="flex items-center"
                      >
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
              <h3 className="font-medium">Photographers</h3>
              
              {photographers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {photographers.map((photographer) => (
                    <div key={photographer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`photo-${photographer.id}`}
                        checked={selectedPhotographers.includes(photographer.id)}
                        onCheckedChange={() => togglePhotographer(photographer.id)}
                      />
                      <Label
                        htmlFor={`photo-${photographer.id}`}
                        className="flex items-center"
                      >
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
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
