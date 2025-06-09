import { useState, useEffect } from "react";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, EventType, StaffMember } from "@/types/models";
import { Checkbox } from "@/components/ui/checkbox";
import MultiStaffSelector from "@/components/events/multi-staff-selector";

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
  const { updateEvent } = useEvents();
  const { staff } = useStaff();
  
  const [formData, setFormData] = useState({
    name: "",
    date: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    location: "",
    organizer: "",
    type: "General" as EventType,
    ignoreScheduleConflicts: false,
    ccsOnlyEvent: false,
  });
  
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when dialog opens or event changes
  useEffect(() => {
    if (open && event) {
      setFormData({
        name: event.name,
        date: event.date ? new Date(event.date) : undefined,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        organizer: event.organizer || "",
        type: event.type,
        ignoreScheduleConflicts: event.ignoreScheduleConflicts || false,
        ccsOnlyEvent: event.ccsOnlyEvent || false,
      });

      // Set selected staff
      const videographerIds = event.videographers?.map(v => v.staffId) || [];
      const photographerIds = event.photographers?.map(p => p.staffId) || [];
      
      setSelectedVideographers(videographerIds);
      setSelectedPhotographers(photographerIds);
    }
  }, [open, event?.id]); // Only depend on open and event.id to prevent infinite loops

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (value: EventType) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!event) {
        throw new Error("Event data is not available.");
      }

      // Validate form data
      if (!formData.name || !formData.date || !formData.startTime || !formData.endTime || !formData.location) {
        alert("Please fill in all required fields.");
        return;
      }

      // Convert date back to string format for Supabase
      const formattedDate = format(formData.date, 'yyyy-MM-dd');

      // Update event
      await updateEvent(
        event.id,
        {
          name: formData.name,
          date: formattedDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          organizer: formData.organizer,
          type: formData.type,
          ignoreScheduleConflicts: formData.ignoreScheduleConflicts,
          ccsOnlyEvent: formData.ccsOnlyEvent,
        },
        selectedVideographers,
        selectedPhotographers
      );

      // Notify parent and close dialog
      onEventUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignedVideographerIds = event.videographers?.map(v => v.staffId) || [];
  const assignedPhotographerIds = event.photographers?.map(p => p.staffId) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to your event here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    {formData.date ? format(formData.date, "MMMM dd, yyyy") : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="organizer" className="text-right">
                Organizer
              </Label>
              <Textarea
                id="organizer"
                name="organizer"
                value={formData.organizer}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select onValueChange={handleSelectChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" defaultValue={formData.type} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="SPECOM">SPECOM</SelectItem>
                  <SelectItem value="LITCOM">LITCOM</SelectItem>
                  <SelectItem value="CUACOM">CUACOM</SelectItem>
                  <SelectItem value="SPODACOM">SPODACOM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ignoreScheduleConflicts" className="text-right">
                Ignore Conflicts
              </Label>
              <Checkbox
                id="ignoreScheduleConflicts"
                name="ignoreScheduleConflicts"
                checked={formData.ignoreScheduleConflicts}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ignoreScheduleConflicts: !!checked }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ccsOnlyEvent" className="text-right">
                CCS Only Event
              </Label>
              <Checkbox
                id="ccsOnlyEvent"
                name="ccsOnlyEvent"
                checked={formData.ccsOnlyEvent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ccsOnlyEvent: !!checked }))}
                className="col-span-3"
              />
            </div>

            {/* Staff Assignment Selectors */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Videographers</Label>
              <div className="col-span-3">
                <MultiStaffSelector
                  role="Videographer"
                  availableStaff={staff.filter(s => s.roles.includes("Videographer"))}
                  selectedStaffIds={selectedVideographers}
                  onSelectionChange={setSelectedVideographers}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Photographers</Label>
              <div className="col-span-3">
                <MultiStaffSelector
                  role="Photographer"
                  availableStaff={staff.filter(s => s.roles.includes("Photographer"))}
                  selectedStaffIds={selectedPhotographers}
                  onSelectionChange={setSelectedPhotographers}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
