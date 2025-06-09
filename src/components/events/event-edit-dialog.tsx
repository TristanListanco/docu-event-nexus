import { useState, useEffect } from "react";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const isMobile = useIsMobile();
  
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
  }, [open, event?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
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
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer">Organizer</Label>
        <Textarea
          id="organizer"
          name="organizer"
          value={formData.organizer}
          onChange={handleInputChange}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select onValueChange={handleSelectChange} value={formData.type}>
          <SelectTrigger>
            <SelectValue />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ignoreScheduleConflicts"
            checked={formData.ignoreScheduleConflicts}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ignoreScheduleConflicts: !!checked }))}
          />
          <Label htmlFor="ignoreScheduleConflicts" className="text-sm">Ignore Conflicts</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ccsOnlyEvent"
            checked={formData.ccsOnlyEvent}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ccsOnlyEvent: !!checked }))}
          />
          <Label htmlFor="ccsOnlyEvent" className="text-sm">CCS Only Event</Label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Videographers</Label>
          <MultiStaffSelector
            role="Videographer"
            availableStaff={staff.filter(s => s.roles.includes("Videographer"))}
            selectedStaffIds={selectedVideographers}
            onSelectionChange={setSelectedVideographers}
            excludeStaffIds={selectedPhotographers}
          />
        </div>

        <div className="space-y-2">
          <Label>Photographers</Label>
          <MultiStaffSelector
            role="Photographer"
            availableStaff={staff.filter(s => s.roles.includes("Photographer"))}
            selectedStaffIds={selectedPhotographers}
            onSelectionChange={setSelectedPhotographers}
            excludeStaffIds={selectedVideographers}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Save changes"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Edit Event</SheetTitle>
            <SheetDescription>
              Make changes to your event here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100%-8rem)] py-4">
            {formContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to your event here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-1">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
