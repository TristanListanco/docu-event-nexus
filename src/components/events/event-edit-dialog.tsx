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
import { Event, EventStatus, StaffAssignment } from "@/types/models";
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
  
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  
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
      
      // Set selected staff from event
      if (event.videographers) {
        setSelectedVideographers(event.videographers.map(v => v.staffId));
      } else {
        setSelectedVideographers([]);
      }
      
      if (event.photographers) {
        setSelectedPhotographers(event.photographers.map(p => p.staffId));
      } else {
        setSelectedPhotographers([]);
      }
      
      // Update available staff when dialog opens
      updateAvailableStaff();
    }
  }, [open, event]);
  
  // Update available staff when date/time changes
  useEffect(() => {
    if (date && startTime && endTime) {
      updateAvailableStaff();
    }
  }, [date, startTime, endTime]);
  
  const updateAvailableStaff = () => {
    if (!date) return;
    
    // Use getStaffByRole instead of getAvailableStaff since we fixed the hook
    const videographers = getStaffByRole("Videographer");
    const photographers = getStaffByRole("Photographer");
    
    // Add currently assigned staff who might not be available now
    const allVideographers = [...videographers];
    const allPhotographers = [...photographers];
    
    // Add currently assigned videographers who might not be in the available list
    if (event.videographers) {
      event.videographers.forEach(assignment => {
        const staffMember = staff.find(s => s.id === assignment.staffId);
        if (staffMember && !allVideographers.some(v => v.id === staffMember.id)) {
          allVideographers.push(staffMember);
        }
      });
    }
    
    // Add currently assigned photographers who might not be in the available list
    if (event.photographers) {
      event.photographers.forEach(assignment => {
        const staffMember = staff.find(s => s.id === assignment.staffId);
        if (staffMember && !allPhotographers.some(p => p.id === staffMember.id)) {
          allPhotographers.push(staffMember);
        }
      });
    }
    
    setAvailableVideographers(allVideographers);
    setAvailablePhotographers(allPhotographers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create videographer assignments
    const videographers: StaffAssignment[] = selectedVideographers.map(staffId => ({
      staffId,
      attendanceStatus: 'Pending'
    }));
    
    // Create photographer assignments
    const photographers: StaffAssignment[] = selectedPhotographers.map(staffId => ({
      staffId,
      attendanceStatus: 'Pending'
    }));

    const updatedEvent: Partial<Event> = {
      name,
      date: date ? format(date, "yyyy-MM-dd") : undefined,
      startTime,
      endTime,
      location,
      status,
      videographers,
      photographers
    };

    const success = await updateEvent(event.id, updatedEvent);

    if (success) {
      onOpenChange(false);
      onEventUpdated();
    }

    setLoading(false);
  };

  const handleVideographerChange = (staffId: string) => {
    if (selectedVideographers.includes(staffId)) {
      setSelectedVideographers(prev => prev.filter(id => id !== staffId));
    } else {
      setSelectedVideographers(prev => [...prev, staffId]);
    }
  };
  
  const handlePhotographerChange = (staffId: string) => {
    if (selectedPhotographers.includes(staffId)) {
      setSelectedPhotographers(prev => prev.filter(id => id !== staffId));
    } else {
      setSelectedPhotographers(prev => [...prev, staffId]);
    }
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
            
            {/* Videographer Assignment */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Videographers
              </Label>
              <div className="col-span-3 space-y-2">
                {availableVideographers.length > 0 ? (
                  availableVideographers.map(videographer => (
                    <div key={videographer.id} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={`video-${videographer.id}`} 
                        checked={selectedVideographers.includes(videographer.id)} 
                        onChange={() => handleVideographerChange(videographer.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`video-${videographer.id}`} className="flex items-center">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                          {videographer.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                        {videographer.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm italic">
                    No videographers available for this time slot
                  </div>
                )}
              </div>
            </div>
            
            {/* Photographer Assignment */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Photographers
              </Label>
              <div className="col-span-3 space-y-2">
                {availablePhotographers.length > 0 ? (
                  availablePhotographers.map(photographer => (
                    <div key={photographer.id} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={`photo-${photographer.id}`} 
                        checked={selectedPhotographers.includes(photographer.id)} 
                        onChange={() => handlePhotographerChange(photographer.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`photo-${photographer.id}`} className="flex items-center">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                          {photographer.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                        {photographer.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm italic">
                    No photographers available for this time slot
                  </div>
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
