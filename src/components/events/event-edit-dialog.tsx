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
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { Event, EventStatus } from "@/types/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
}

export default function EventEditDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
}: EventEditDialogProps) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState<Date | undefined>(
    event.date ? new Date(event.date) : undefined
  );
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [location, setLocation] = useState(event.location);
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(event.ignoreScheduleConflicts);
  
  const [selectedVideographer, setSelectedVideographer] = useState<string>("");
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const { updateEvent } = useEvents();
  const { staff, getStaffByRole } = useStaff();
  
  const [availableVideographers, setAvailableVideographers] = useState<any[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setName(event.name);
      setDate(event.date ? new Date(event.date) : undefined);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setLocation(event.location);
      setStatus(event.status);
      setIgnoreScheduleConflicts(event.ignoreScheduleConflicts);
      
      // Set selected staff from event - now we only choose one from each role
      if (event.videographers && event.videographers.length > 0) {
        setSelectedVideographer(event.videographers[0].staffId);
      } else {
        setSelectedVideographer("");
      }
      
      if (event.photographers && event.photographers.length > 0) {
        setSelectedPhotographer(event.photographers[0].staffId);
      } else {
        setSelectedPhotographer("");
      }
      
      // Update available staff when dialog opens
      updateAvailableStaff();
    }
  }, [open, event]);
  
  // Update available staff when date/time or ignore conflicts changes
  useEffect(() => {
    if (date && startTime && endTime) {
      updateAvailableStaff();
    }
  }, [date, startTime, endTime, ignoreScheduleConflicts]);
  
  const updateAvailableStaff = () => {
    if (!date) return;
    
    // If ignoring conflicts, get all staff members by role
    if (ignoreScheduleConflicts) {
      setAvailableVideographers(getStaffByRole("Videographer"));
      setAvailablePhotographers(getStaffByRole("Photographer"));
    } else {
      // In a real app, this would check for availability based on date/time
      // For now, we'll show all staff
      setAvailableVideographers(getStaffByRole("Videographer"));
      setAvailablePhotographers(getStaffByRole("Photographer"));
    }
    
    // Make sure currently assigned staff are included
    const ensureStaffIsIncluded = (staffId: string, staffList: any[], setter: React.Dispatch<React.SetStateAction<any[]>>) => {
      if (staffId && !staffList.some(s => s.id === staffId)) {
        const staffMember = staff.find(s => s.id === staffId);
        if (staffMember) {
          setter(prev => [...prev, staffMember]);
        }
      }
    };
    
    // Ensure currently assigned videographer is in the list
    if (selectedVideographer) {
      ensureStaffIsIncluded(selectedVideographer, availableVideographers, setAvailableVideographers);
    }
    
    // Ensure currently assigned photographer is in the list
    if (selectedPhotographer) {
      ensureStaffIsIncluded(selectedPhotographer, availablePhotographers, setAvailablePhotographers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Now we only send single staff members as arrays with one item
    const videographerIds = selectedVideographer ? [selectedVideographer] : [];
    const photographerIds = selectedPhotographer ? [selectedPhotographer] : [];

    const updatedEvent = {
      name,
      date: date ? format(date, "yyyy-MM-dd") : undefined,
      startTime,
      endTime,
      location,
      status,
      ignoreScheduleConflicts
    };

    const success = await updateEvent(event.id, updatedEvent, videographerIds, photographerIds);

    if (success) {
      onOpenChange(false);
      onEventUpdated();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the details and staff assignments for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date</Label>
              <div className="col-span-3">
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
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventStatus" className="text-right">
                Event Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as EventStatus)}
              >
                <SelectTrigger className="col-span-3">
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
            
            {/* Ignore Schedule Conflicts checkbox */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Schedule
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox 
                  id="ignoreConflicts" 
                  checked={ignoreScheduleConflicts} 
                  onCheckedChange={(checked) => setIgnoreScheduleConflicts(!!checked)}
                />
                <label htmlFor="ignoreConflicts" className="text-sm">
                  Ignore Schedule Conflicts
                </label>
              </div>
            </div>
            
            {/* Videographer Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="videographer" className="text-right">
                Videographer
              </Label>
              <div className="col-span-3">
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
                      <SelectItem key="no-videographers" value="no-videographers" disabled>
                        No videographers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableVideographers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No videographers available for this time slot
                  </p>
                )}
              </div>
            </div>
            
            {/* Photographer Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="photographer" className="text-right">
                Photographer
              </Label>
              <div className="col-span-3">
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
                      <SelectItem key="no-photographers" value="no-photographers" disabled>
                        No photographers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availablePhotographers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No photographers available for this time slot
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
