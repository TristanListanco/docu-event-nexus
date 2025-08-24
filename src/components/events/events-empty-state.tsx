
import { Calendar, Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EventsEmptyStateProps {
  searchQuery: string;
  isArchived?: boolean;
}

export default function EventsEmptyState({ 
  searchQuery, 
  isArchived = false 
}: EventsEmptyStateProps) {
  const navigate = useNavigate();

  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {isArchived ? (
            <Archive className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Calendar className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No {isArchived ? 'archived ' : ''}events found
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          No {isArchived ? 'archived ' : ''}events match your search for "{searchQuery}". 
          Try adjusting your search terms or filters.
        </p>
      </div>
    );
  }

  if (isArchived) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Archive className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No archived events
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Your completed and elapsed events will appear here once you have some.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No events yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Get started by creating your first event. You can add details, assign staff, and manage everything from one place.
      </p>
      <Button onClick={() => navigate("/events/add")} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Your First Event
      </Button>
    </div>
  );
}
