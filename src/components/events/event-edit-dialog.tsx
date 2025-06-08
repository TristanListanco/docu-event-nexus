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
import { CalendarIcon, Clock, GraduationCap } from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { useEvents } from "@/hooks/use-events";
import { Event, EventStatus, EventType, StaffMember } from "@/types/models";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import MultiStaffSelector from "./multi-staff-selector";

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
  const [organizer, setOrganizer] = useState(event.organizer || "");
  const [type, setType] = useState<EventType>(event.type);
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(event.ignoreScheduleConflicts);
  const [ccsOnlyEvent, setCcsOnlyEvent] = useState(event.ccsOnlyEvent);
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  const [scheduleCalculated, setScheduleCalculated] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const { staff, getAvailableStaff } = useStaff();
  const { updateEvent } = useEvents();
  const { toast } = useToast();
  
  // Initialize form values when event or dialog opens
  useEffect(() => {
    if (open && event) {
      setName(event.name);
      setDate(new Date(event.date));
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setLocation(event.location);
      setOrganizer(event.organizer || "");
      setType(event.type);
      setStatus(event.status);
      setIgnoreScheduleConflicts(event.ignoreScheduleConflicts);
      setCcsOnlyEvent(event.ccsOnlyEvent);
      
      // Initialize selected staff from event
      const assignedVideographers = event.videographers?.map(v => v.staffId) || [];
      const assignedPhotographers = event.photographers?.map(p => p.staffId) || [];
      
      setSelectedVideographers(assignedVideographers);
      setSelectedPhotographers(assignedPhotographers);
    }
  }, [event, open]);
  
  // Calculate available staff when date, time, conflicts setting, or CCS-only setting changes
  useEffect(() => {
    if (date && startTime && endTime && staff.length > 0) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { videographers, photographers } = getAvailableStaff(
        formattedDate,
        startTime,
        endTime,
        ignoreScheduleConflicts,
        ccsOnlyEvent
      );
      
      // Always include currently assigned staff even if they're not available
      let allVideographers = [...videographers];
      let allPhotographers = [...photographers];
      
      // Add current videographers if not in available list
      if (event.videographers && event.videographers.length > 0) {
        event.videographers.forEach(assignment => {
          const currentVideographer = staff.find(s => s.id === assignment.staffId);
          if (currentVideographer && !allVideographers.some(v => v.id === currentVideographer.id)) {
            allVideographers.push(currentVideographer);
          }
        });
      }
      
      // Add current photographers if not in available list
      if (event.photographers && event.photographers.length > 0) {
        event.photographers.forEach(assignment => {
          const currentPhotographer = staff.find(s => s.id === assignment.staffId);
          if (currentPhotographer && !allPhotographers.some(p => p.id === currentPhotographer.id)) {
            allPhotographers.push(currentPhotographer);
          }
        });
      }
      
      setAvailableVideographers(allVideographers);
      setAvailablePhotographers(allPhotographers);
      setScheduleCalculated(true);
    } else {
      setAvailableVideographers([]);
      setAvailablePhotographers([]);
      setScheduleCalculated(false);
    }
  }, [date, startTime, endTime, ignoreScheduleConflicts, ccsOnlyEvent, staff, getAvailableStaff, event.videographers, event.photographers]);
  
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
      const success = await updateEvent(
        event.id,
        {
          name,
          date: format(date, 'yyyy-MM-dd'),
          startTime,
          endTime,
          location,
          organizer: organizer || undefined,
          type,
          status,
          ignoreScheduleConflicts,
          ccsOnlyEvent,
        },
        selectedVideographers,
        selectedPhotographers
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

          {/* Organizer field */}
          <div className="grid gap-2">
            <Label htmlFor="organizer">Organizer/s</Label>
            <Input
              id="organizer"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="Event Organizer/s"
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
          
          {/* CCS-only Event */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ccsOnlyEvent"
              checked={ccsOnlyEvent}
              onCheckedChange={(checked) => setCcsOnlyEvent(!!checked)}
            />
            <Label htmlFor="ccsOnlyEvent" className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2" />
              CCS-only Event (BCA, CCC, CSC, ISY, ITE, ITN, ITD classes suspended)
            </Label>
          </div>
          
          {/* Staff Assignment */}
          <div className="grid gap-4 pt-2">
            <h3 className="text-sm font-semibold">Staff Assignment</h3>
            
            {scheduleCalculated && (
              <p className="text-xs text-muted-foreground">
                {ignoreScheduleConflicts 
                  ? "Showing all staff members (schedule conflicts ignored)" 
                  : ccsOnlyEvent
                  ? "Showing staff members available for the selected time slot (CCS classes suspended)"
                  : "Showing only staff members available for the selected time slot"}
              </p>
            )}
            
            <div className="space-y-4">
              <MultiStaffSelector
                role="Videographer"
                availableStaff={availableVideographers}
                selectedStaffIds={selectedVideographers}
                onSelectionChange={setSelectedVideographers}
                disabled={!scheduleCalculated}
              />
              
              <MultiStaffSelector
                role="Photographer"
                availableStaff={availablePhotographers}
                selectedStaffIds={selectedPhotographers}
                onSelectionChange={setSelectedPhotographers}
                disabled={!scheduleCalculated}
              />
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
