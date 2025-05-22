
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
import { useStaffSelection } from "@/hooks/use-staff-selection";

export default function AddEventPage() {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  
  // Use the staff selection hook for handling staff availability
  const {
    ignoreScheduleConflicts,
    setIgnoreScheduleConflicts,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    getAvailableStaffMembers,
    selectedVideographers,
    selectedPhotographers,
    toggleStaffSelection,
  } = useStaffSelection();
  
  // Event form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [loading, setLoading] = useState(false);
  
  // Get available staff based on selected date and time
  const { videographers, photographers } = getAvailableStaffMembers();
  
  // Toggle staff selection
  const toggleVideographer = (staffId: string) => {
    toggleStaffSelection(staffId, 'videographer');
  };
  
  const togglePhotographer = (staffId: string) => {
    toggleStaffSelection(staffId, 'photographer');
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !startTime || !endTime || !name || !location) {
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
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        location,
        type,
        status: "Upcoming" as const,
        videographers: selectedVideographers,
        photographers: selectedPhotographers,
        ignoreScheduleConflicts,
        isBigEvent: false // Adding the missing property
      };
      
      await createEvent(eventData);
      navigate("/events");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false);
    }
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
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ignore-conflicts"
                checked={ignoreScheduleConflicts}
                onCheckedChange={(checked) => setIgnoreScheduleConflicts(checked === true)}
              />
              <Label htmlFor="ignore-conflicts">
                Ignore staff schedule conflicts
              </Label>
            </div>
            
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
            
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
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
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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
                  {selectedDate && startTime && endTime
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
                  {selectedDate && startTime && endTime
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
