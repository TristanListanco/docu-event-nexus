
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EventTypeDialog({ open, onOpenChange }: EventTypeDialogProps) {
  const navigate = useNavigate();
  
  const handleSingleEvent = () => {
    navigate("/events/add");
    onOpenChange(false);
  };
  
  const handleMultiDayEvent = () => {
    navigate("/events/add-multi");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choose Event Type</DialogTitle>
          <DialogDescription>
            Select whether you want to create a single event or a multi-day event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-36 p-4"
            onClick={handleSingleEvent}
          >
            <CalendarIcon className="h-12 w-12 mb-2 text-primary" />
            <span className="font-medium">Single Event</span>
            <span className="text-xs text-muted-foreground mt-1 text-center">
              Create one event on a specific date
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-36 p-4"
            onClick={handleMultiDayEvent}
          >
            <CalendarDays className="h-12 w-12 mb-2 text-primary" />
            <span className="font-medium">Multi-Day Event</span>
            <span className="text-xs text-muted-foreground mt-1 text-center">
              Create multiple events over a span of dates
            </span>
          </Button>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
