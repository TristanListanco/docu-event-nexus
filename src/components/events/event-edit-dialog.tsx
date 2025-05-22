
// Creating a component to update the event edit dialog with similar functionality as the AddEventPage
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { Event, EventStatus, EventType, StaffMember } from "@/types/models";
import { toast } from "@/hooks/use-toast";

interface EventEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onDelete?: () => void;
}

export default function EventEditDialog({ isOpen, onClose, event }: EventEditDialogProps) {
  const [name, setName] = useState(event?.name || "");
  const [date, setDate] = useState<Date | undefined>(
    event?.date ? new Date(event.date) : undefined
  );
  const [startTime, setStartTime] = useState(event?.startTime || "");
  const [endTime, setEndTime] = useState(event?.endTime || "");
  const [location, setLocation] = useState(event?.location || "");
  const [type, setType] = useState<EventType>(event?.type || "General");
  const [status, setStatus] = useState<EventStatus>(event?.status || "Upcoming");
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(
    event?.ignoreScheduleConflicts || false
  );
  const [selectedVideographer, setSelectedVideographer] = useState<string>(
    event?.videographers && event.videographers.length > 0 ? event.videographers[0].staffId : ""
  );
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>(
    event?.photographers && event.photographers.length > 0 ? event.photographers[0].staffId : ""
  );
  
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  const [scheduleCalculated, setScheduleCalculated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { updateEvent } = useEvents();
  const { staff, getAvailableStaff, getStaffById } = useStaff();

  // Update form fields when event changes
  useEffect(() => {
    if (event) {
      setName(event.name);
      setDate(event.date ? new Date(event.date) : undefined);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setLocation(event.location);
      setType(event.type);
      setStatus(event.status);
      setIgnoreScheduleConflicts(event.ignoreScheduleConflicts);
      setSelectedVideographer(
        event.videographers && event.videographers.length > 0 ? event.videographers[0].staffId : ""
      );
      setSelectedPhotographer(
        event.photographers && event.photographers.length > 0 ? event.photographers[0].staffId : ""
      );
    }
  }, [event]);

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
      
      // For editing, we should always include the currently assigned staff members
      // even if they now have schedule conflicts
      if (event?.videographers && event.videographers.length > 0) {
        const currentVid = event.videographers[0].staffId;
        const currentVidStaff = getStaffById(currentVid);
        
        if (currentVidStaff && !videographers.some(v => v.id === currentVid)) {
          videographers.push(currentVidStaff);
        }
      }
      
      if (event?.photographers && event.photographers.length > 0) {
        const currentPhoto = event.photographers[0].staffId;
        const currentPhotoStaff = getStaffById(currentPhoto);
        
        if (currentPhotoStaff && !photographers.some(p => p.id === currentPhoto)) {
          photographers.push(currentPhotoStaff);
        }
      }
      
      setAvailableVideographers(videographers);
      setAvailablePhotographers(photographers);
      setScheduleCalculated(true);
    } else {
      setScheduleCalculated(false);
    }
  }, [date, startTime, endTime, ignoreScheduleConflicts, staff, event]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!name || !date || !startTime || !endTime || !location) {
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
      
      // Update the event
      const success = await updateEvent(
        event.id,
        {
          name,
          date: date.toISOString().split('T')[0],
          startTime,
          endTime,
          location,
          type,
          status,
          ignoreScheduleConflicts,
          isBigEvent: false, // No longer used
          bigEventId: "" // No longer used
        },
        videographerIds,
        photographerIds
      );
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to the event details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name field */}
          <div>
            <Label htmlFor="edit-name">Event Name</Label>
            <Input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event Name"
              required
            />
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
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startTime">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-endTime">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-endTime"
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
            <Label htmlFor="edit-location">Event Location</Label>
            <Input
              id="edit-location"
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
              <Label htmlFor="edit-type">Event Type</Label>
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
              <Label htmlFor="edit-status">Event Status</Label>
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
              id="edit-ignoreConflicts"
              checked={ignoreScheduleConflicts}
              onCheckedChange={(checked) => setIgnoreScheduleConflicts(!!checked)}
            />
            <Label htmlFor="edit-ignoreConflicts">Show all staff (ignore schedule conflicts)</Label>
          </div>
          
          {/* Staff Assignment Section */}
          <div className="pt-2">
            <h3 className="text-lg font-semibold mb-2">Staff Assignment</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              {/* Instructions */}
              {!scheduleCalculated && (
                <p className="text-sm text-muted-foreground">
                  Please ensure date and time are selected to see available staff
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
                <Label htmlFor="edit-videographer">Videographer</Label>
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
                      <SelectItem key="no-videographers" value="no-videographers" disabled>
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
                <Label htmlFor="edit-photographer">Photographer</Label>
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
                      <SelectItem key="no-photographers" value="no-photographers" disabled>
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
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
