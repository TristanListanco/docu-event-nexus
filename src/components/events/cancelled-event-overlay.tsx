
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface CancelledEventOverlayProps {
  isVisible: boolean;
  onDelete: () => void;
  className?: string;
}

export default function CancelledEventOverlay({ 
  isVisible, 
  onDelete, 
  className 
}: CancelledEventOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center z-10",
      className
    )}>
      <div className="text-center space-y-4">
        <div className="text-muted-foreground">
          <p className="text-lg font-semibold">Event Cancelled</p>
          <p className="text-sm">This event has been cancelled</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Event
        </Button>
      </div>
    </div>
  );
}
