import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EventType } from "@/types/models";
import { useToast } from "@/components/ui/use-toast";
import { useEvents } from "@/hooks/use-events";
import { useStaffSelection } from "@/hooks/use-staff-selection";
import { useStaff } from "@/hooks/use-staff";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AddEventPage() {
  // State variables
  const [name, setName] = useState("");
  const [type, setType] = useState<EventType>("Photo");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);

  // Hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addEvent } = useEvents();
  const { staff: allStaff, isLoading: isStaffLoading, error: staffError } = useStaff();
  const {
    videographers: availableVideographers,
    photographers: availablePhotographers,
    toggleVideographer,
    togglePhotographer,
  } = useStaffSelection(allStaff);
  
  // Fix the date handling
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(false);
  
  // Handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleTypeChange = (value: EventType) => {
    setType(value);
    setSelectedVideographers([]);
    setSelectedPhotographers([]);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
  };
  
  const handleAddEvent = async () => {
    if (!name || !date || !startTime || !endTime || !location || !type) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (end <= start) {
      toast({
        title: "Invalid Time",
        description: "End time must be later than start time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
      
      // Add isBigEvent field to match the Event type
      await addEvent({
        name,
        date: formattedDate,
        startTime,
        endTime,
        location,
        type,
        status: "Upcoming",
        videographers: selectedVideographers,
        photographers: selectedPhotographers,
        ignoreScheduleConflicts,
        isBigEvent: false, // Adding the missing field
      });

      toast({
        title: "Event Added",
        description: "Event added successfully!",
      });
      navigate("/events");
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "Failed to add event. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    if (staffError) {
      toast({
        title: "Error",
        description: `Failed to load staff. ${staffError}`,
        variant: "destructive",
      });
    }
  }, [staffError, toast]);

  if (isStaffLoading) {
    return <div className="container py-6">Loading staff data...</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Add New Event</h1>
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Fill in the details for the new event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              placeholder="Event Name"
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Event Type</Label>
            <Select onValueChange={handleTypeChange} defaultValue={type}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Photo">Photo</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Location"
              value={location}
              onChange={handleLocationChange}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ignoreSchedule" 
                checked={ignoreScheduleConflicts}
                onCheckedChange={(checked) => 
                  setIgnoreScheduleConflicts(checked === true)
                }
              />
              <Label htmlFor="ignoreSchedule">
                Ignore staff schedule conflicts
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Check this to assign staff even if they have conflicting schedules
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="mx-auto"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={handleStartTimeChange}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={handleEndTimeChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            {type === "Video" || type === "Both" ? (
              <div className="space-y-2">
                <Label>Videographers</Label>
                <ScrollArea className="h-40 rounded-md border p-2">
                  {availableVideographers.map((staffMember) => (
                    <div key={staffMember.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`videographer-${staffMember.id}`}
                        checked={selectedVideographers.includes(staffMember.id)}
                        onCheckedChange={(checked) => {
                          toggleVideographer(staffMember.id);
                          setSelectedVideographers((prev) => {
                            if (checked) {
                              return [...prev, staffMember.id];
                            } else {
                              return prev.filter((id) => id !== staffMember.id);
                            }
                          });
                        }}
                      />
                      <Label htmlFor={`videographer-${staffMember.id}`}>
                        {staffMember.name}
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            ) : null}

            {type === "Photo" || type === "Both" ? (
              <div className="space-y-2">
                <Label>Photographers</Label>
                <ScrollArea className="h-40 rounded-md border p-2">
                  {availablePhotographers.map((staffMember) => (
                    <div key={staffMember.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`photographer-${staffMember.id}`}
                        checked={selectedPhotographers.includes(staffMember.id)}
                        onCheckedChange={(checked) => {
                          togglePhotographer(staffMember.id);
                          setSelectedPhotographers((prev) => {
                            if (checked) {
                              return [...prev, staffMember.id];
                            } else {
                              return prev.filter((id) => id !== staffMember.id);
                            }
                          });
                        }}
                      />
                      <Label htmlFor={`photographer-${staffMember.id}`}>
                        {staffMember.name}
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate("/events")}>
            Cancel
          </Button>
          <Button onClick={handleAddEvent}>Add Event</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
