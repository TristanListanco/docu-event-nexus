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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { Event, EventType, StaffMember } from "@/types/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
  readOnlyStaff?: boolean;
}

export default function EventEditDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
  readOnlyStaff = false,
}: EventEditDialogProps) {
  const { updateEvent } = useEvents();
  const { staff, getAvailableStaff } = useStaff();
  
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState<Date | undefined>(
    event.date ? new Date(event.date) : undefined
  );
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [location, setLocation] = useState(event.location);
  const [type, setType] = useState<EventType>(event.type);
  const [status, setStatus] = useState(event.status);
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(
    event.ignoreScheduleConflicts
  );
  
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>(
    event.videographers?.map((v) => v.staffId) || []
  );
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>(
    event.photographers?.map((p) => p.staffId) || []
  );
  
  const [availableStaff, setAvailableStaff] = useState<{
    videographers: StaffMember[];
    photographers: StaffMember[];
  }>({ videographers: [], photographers: [] });
  
  const [loading, setLoading] = useState(false);
  
  const [assignedVideographers, setAssignedVideographers] = useState<StaffMember[]>([]);
  const [assignedPhotographers, setAssignedPhotographers] = useState<StaffMember[]>([]);

  useEffect(() => {
    // If staff selection is read-only, we need to find the assigned staff members
    if (readOnlyStaff && staff.length > 0) {
      const videographers = staff.filter(s => 
        event.videographers?.some(v => v.staffId === s.id)
      );
      
      const photographers = staff.filter(s => 
        event.photographers?.some(p => p.staffId === s.id)
      );
      
      setAssignedVideographers(videographers);
      setAssignedPhotographers(photographers);
    }
  }, [readOnlyStaff, event.videographers, event.photographers, staff]);

  // Update available staff when date or time changes
  useEffect(() => {
    if (date && startTime && endTime && !readOnlyStaff) {
      const formattedDate = format(date, "yyyy-MM-dd");
      const available = getAvailableStaff(formattedDate, startTime, endTime);
      setAvailableStaff(available);
    }
  }, [date, startTime, endTime, getAvailableStaff, readOnlyStaff]);

  // Handle videographer selection
  const handleVideographerSelection = (staffId: string) => {
    setSelectedVideographers((prev) => {
      if (prev.includes(staffId)) {
        return prev.filter((id) => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  // Handle photographer selection
  const handlePhotographerSelection = (staffId: string) => {
    setSelectedPhotographers((prev) => {
      if (prev.includes(staffId)) {
        return prev.filter((id) => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset form state
    setName(event.name);
    setDate(event.date ? new Date(event.date) : undefined);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setLocation(event.location);
    setType(event.type);
    setStatus(event.status);
    setIgnoreScheduleConflicts(event.ignoreScheduleConflicts);
    setSelectedVideographers(event.videographers?.map((v) => v.staffId) || []);
    setSelectedPhotographers(event.photographers?.map((p) => p.staffId) || []);
    
    onOpenChange(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name || !date || !startTime || !endTime || !location) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare the event update data
      const updateData: Partial<Event> = {
        name,
        date: format(date, "yyyy-MM-dd"),
        startTime,
        endTime,
        location,
        type,
        status,
        ignoreScheduleConflicts,
      };
      
      // Only include staff assignments if they're not read-only
      if (!readOnlyStaff) {
        // Convert selected IDs to staff assignment objects
        updateData.videographers = selectedVideographers.map((staffId) => ({
          staffId,
          attendanceStatus: event.videographers?.find((v) => v.staffId === staffId)
            ?.attendanceStatus || "Pending",
        }));
        
        updateData.photographers = selectedPhotographers.map((staffId) => ({
          staffId,
          attendanceStatus: event.photographers?.find((p) => p.staffId === staffId)
            ?.attendanceStatus || "Pending",
        }));
      }
      
      // Update the event
      const success = await updateEvent(event.id, updateData);
      
      if (success) {
        onEventUpdated();
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the event",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Update event details and assignments</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Event Name
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
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select a date</span>}
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
              <Label htmlFor="type" className="text-right">
                Event Type
              </Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as EventType)}
              >
                <SelectTrigger id="type" className="col-span-3">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as Event["status"])
                }
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select event status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {readOnlyStaff ? (
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-3">Assigned Staff</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-2" />
                      Videographers
                    </h4>
                    <div className="space-y-2">
                      {assignedVideographers.length > 0 ? (
                        <div className="grid gap-2">
                          {assignedVideographers.map(videographer => (
                            <div 
                              key={videographer.id}
                              className="flex items-center p-2 bg-muted/50 rounded-md"
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={videographer.photoUrl} alt={videographer.name} />
                                <AvatarFallback className="text-xs">
                                  {videographer.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{videographer.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No videographers assigned</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <ArrowDown className="h-3 w-3 mr-2" />
                      Photographers
                    </h4>
                    <div className="space-y-2">
                      {assignedPhotographers.length > 0 ? (
                        <div className="grid gap-2">
                          {assignedPhotographers.map(photographer => (
                            <div 
                              key={photographer.id}
                              className="flex items-center p-2 bg-muted/50 rounded-md"
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={photographer.photoUrl} alt={photographer.name} />
                                <AvatarFallback className="text-xs">
                                  {photographer.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{photographer.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No photographers assigned</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4 italic">
                  Staff assignments cannot be modified for already created events
                </p>
              </div>
            ) : (
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center mb-4">
                  <Checkbox
                    id="ignoreScheduleConflicts"
                    checked={ignoreScheduleConflicts}
                    onCheckedChange={(checked) => {
                      setIgnoreScheduleConflicts(!!checked);
                    }}
                    className="mr-2"
                  />
                  <Label htmlFor="ignoreScheduleConflicts">
                    Ignore schedule conflicts
                  </Label>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Videographers</h4>
                    {availableStaff.videographers.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableStaff.videographers.map((videographer) => (
                          <div
                            key={videographer.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`video-${videographer.id}`}
                              checked={selectedVideographers.includes(videographer.id)}
                              onCheckedChange={() =>
                                handleVideographerSelection(videographer.id)
                              }
                            />
                            <Label
                              htmlFor={`video-${videographer.id}`}
                              className="flex items-center text-sm"
                            >
                              <span className="mr-1">
                                {videographer.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                              <span>{videographer.name}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {date && startTime && endTime
                          ? "No videographers available for this time slot"
                          : "Select date and time to see available videographers"}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Photographers</h4>
                    {availableStaff.photographers.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableStaff.photographers.map((photographer) => (
                          <div
                            key={photographer.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`photo-${photographer.id}`}
                              checked={selectedPhotographers.includes(
                                photographer.id
                              )}
                              onCheckedChange={() =>
                                handlePhotographerSelection(photographer.id)
                              }
                            />
                            <Label
                              htmlFor={`photo-${photographer.id}`}
                              className="flex items-center text-sm"
                            >
                              <span className="mr-1">
                                {photographer.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                              <span>{photographer.name}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {date && startTime && endTime
                          ? "No photographers available for this time slot"
                          : "Select date and time to see available photographers"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
