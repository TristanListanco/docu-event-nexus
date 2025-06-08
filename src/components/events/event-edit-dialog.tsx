import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, Clock, Camera, Video } from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { useEvents } from "@/hooks/use-events";
import { Event, EventStatus, EventType, StaffMember } from "@/types/models";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
}

export default function EventEditDialog({ open, onOpenChange, event, onEventUpdated }: EventEditDialogProps) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState<Date>(new Date(event.date));
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [location, setLocation] = useState(event.location);
  const [type, setType] = useState<EventType>(event.type);
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(event.ignoreScheduleConflicts);
  const [selectedVideographer, setSelectedVideographer] = useState<string>("");
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("");
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  const [scheduleCalculated, setScheduleCalculated] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const { staff, getAvailableStaff } = useStaff();
  const { updateEvent } = useEvents();
  const { toast } = useToast();
  
  // Initialize selected staff from event
  useEffect(() => {
    if (event.videographers && event.videographers.length > 0) {
      setSelectedVideographer(event.videographers[0].staffId);
    } else {
      setSelectedVideographer("none");
    }
    if (event.photographers && event.photographers.length > 0) {
      setSelectedPhotographer(event.photographers[0].staffId);
    } else {
      setSelectedPhotographer("none");
    }
    
    // Reset form values when event changes
    setName(event.name);
    setDate(new Date(event.date));
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setLocation(event.location);
    setType(event.type);
    setStatus(event.status);
    setIgnoreScheduleConflicts(event.ignoreScheduleConflicts);
  }, [event]);
  
  // Calculate available staff
  useEffect(() => {
    if (date && startTime && endTime) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { videographers, photographers } = getAvailableStaff(
        formattedDate,
        startTime,
        endTime,
        ignoreScheduleConflicts
      );
      
      // Always include currently assigned staff even if they're not available
      let allVideographers = [...videographers];
      let allPhotographers = [...photographers];
      
      // Add current videographer if not in available list
      if (event.videographers && event.videographers.length > 0) {
        const currentVideographer = staff.find(s => s.id === event.videographers[0].staffId);
        if (currentVideographer && !allVideographers.some(v => v.id === currentVideographer.id)) {
          allVideographers.push(currentVideographer);
        }
      }
      
      // Add current photographer if not in available list
      if (event.photographers && event.photographers.length > 0) {
        const currentPhotographer = staff.find(s => s.id === event.photographers[0].staffId);
        if (currentPhotographer && !allPhotographers.some(p => p.id === currentPhotographer.id)) {
          allPhotographers.push(currentPhotographer);
        }
      }
      
      setAvailableVideographers(allVideographers);
      setAvailablePhotographers(allPhotographers);
      setScheduleCalculated(true);
      
      // Only reset selections if they are not the current event staff and not available
      const videographerStillAvailable = allVideographers.some(v => v.id === selectedVideographer);
      const photographerStillAvailable = allPhotographers.some(p => p.id === selectedPhotographer);
      
      // Check if the currently selected videographer is the one from the event
      const isCurrentEventVideographer = event.videographers && 
        event.videographers.length > 0 && 
        selectedVideographer === event.videographers[0].staffId;
      
      // Check if the currently selected photographer is the one from the event
      const isCurrentEventPhotographer = event.photographers && 
        event.photographers.length > 0 && 
        selectedPhotographer === event.photographers[0].staffId;
      
      // Only reset if not available AND not the current event staff member
      if (!videographerStillAvailable && !isCurrentEventVideographer) {
        setSelectedVideographer("none");
      }
      
      if (!photographerStillAvailable && !isCurrentEventPhotographer) {
        setSelectedPhotographer("none");
      }
    } else {
      setAvailableVideographers([]);
      setAvailablePhotographers([]);
      setScheduleCalculated(false);
    }
  }, [date, startTime, endTime, ignoreScheduleConflicts, staff, getAvailableStaff, event.videographers, event.photographers, selectedVideographer, selectedPhotographer]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);
    
    if (new Date(`${date.toISOString().split('T')[0]}T${endTime}`) <= new Date(`${date.toISOString().split('T')[0]}T${startTime}`)) {
      toast({
        title: "Invalid Time",
        description: "End time must be later than start time.",
        variant: "destructive",
      });
      setUpdating(false);
      return;
    }
    
    try {
      // Create arrays with selected staff IDs
      const videographerIds = selectedVideographer && selectedVideographer !== "none" ? [selectedVideographer] : [];
      const photographerIds = selectedPhotographer && selectedPhotographer !== "none" ? [selectedPhotographer] : [];
      
      const success = await updateEvent(
        event.id,
        {
          name,
          date: format(date, 'yyyy-MM-dd'),
          startTime,
          endTime,
          location,
          type,
          status,
          ignoreScheduleConflicts,
        },
        videographerIds,
        photographerIds
      );
      
      if (success) {
        onOpenChange(false);
        onEventUpdated();
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Name field */}
          <div className="grid gap-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          {/* Date field */}
          <div className="grid gap-2">
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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
          
          {/* Location field */}
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          
          {/* Type and Status fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Event Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as EventStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
          
          {/* Ignore Schedule Conflicts */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ignoreConflicts"
              checked={ignoreScheduleConflicts}
              onCheckedChange={(checked) => setIgnoreScheduleConflicts(!!checked)}
            />
            <Label htmlFor="ignoreConflicts">Show all staff (ignore schedule conflicts)</Label>
          </div>
          
          {/* Staff Assignment - Combined section */}
          <div className="grid gap-4 pt-2">
            <h3 className="text-sm font-semibold">Staff Assignment</h3>
            
            {scheduleCalculated && (
              <p className="text-xs text-muted-foreground">
                {ignoreScheduleConflicts 
                  ? "Showing all staff members (schedule conflicts ignored)" 
                  : "Showing only staff members available for the selected time slot"}
              </p>
            )}
            
            {/* Unified staff section */}
            <div className="space-y-4">
              {/* Videographer selection */}
              <div>
                <Label htmlFor="videographer" className="flex items-center">
                  <Video className="h-4 w-4 mr-2 text-primary" />
                  Videographer
                </Label>
                <Select 
                  value={selectedVideographer} 
                  onValueChange={setSelectedVideographer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a videographer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
              </div>
              
              {/* Photographer selection */}
              <div>
                <Label htmlFor="photographer" className="flex items-center">
                  <Camera className="h-4 w-4 mr-2 text-primary" />
                  Photographer
                </Label>
                <Select 
                  value={selectedPhotographer} 
                  onValueChange={setSelectedPhotographer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a photographer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
