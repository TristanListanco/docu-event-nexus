
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventsEmptyStateProps {
  searchQuery: string;
}

export default function EventsEmptyState({ searchQuery }: EventsEmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No events found</h3>
      <p className="text-muted-foreground text-center mt-2">
        {searchQuery ? 
          "No events match your search criteria. Try a different search term." : 
          "You haven't created any events yet. Click the 'Add Event' button to get started."}
      </p>
      {!searchQuery && (
        <Button onClick={() => navigate("/events/new")} className="mt-4">
          <Plus className="mr-2 h-4 w-4" /> Create Your First Event
        </Button>
      )}
    </div>
  );
}
