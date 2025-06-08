
import { Button } from "@/components/ui/button";
import { Calendar, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventsHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function EventsHeader({ loading, onRefresh }: EventsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage your scheduled events</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate("/events/new")}>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>
    </div>
  );
}
