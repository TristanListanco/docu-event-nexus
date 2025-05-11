
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-semibold">Choose Event Type</DialogTitle>
          <DialogDescription className="text-sm sm:text-base mt-2">
            Select whether you want to create a single event or a multi-day event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 py-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-40 sm:h-48 p-4 sm:p-6"
            onClick={handleSingleEvent}
          >
            <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-5 text-primary" />
            <span className="font-medium text-base sm:text-lg mb-1 sm:mb-2">Single Event</span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Create one event on a specific date
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-40 sm:h-48 p-4 sm:p-6"
            onClick={handleMultiDayEvent}
          >
            <CalendarDays className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-5 text-primary" />
            <span className="font-medium text-base sm:text-lg mb-1 sm:mb-2">Multi-Day Event</span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Create multiple events over a span of dates
            </span>
          </Button>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
