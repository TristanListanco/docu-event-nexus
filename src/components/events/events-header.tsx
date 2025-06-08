
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventsHeaderProps {
  // Remove loading and onRefresh props as they're no longer needed
}

export default function EventsHeader({}: EventsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage your scheduled events</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate("/events/new")} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
