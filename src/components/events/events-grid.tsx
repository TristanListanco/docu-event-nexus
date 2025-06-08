
import { ScrollArea } from "@/components/ui/scroll-area";
import EventCard from "./event-card";
import { Event } from "@/types/models";

interface EventsGridProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEditEvent: (e: React.MouseEvent, event: Event) => void;
  onDeleteEvent: (e: React.MouseEvent, event: Event) => void;
  getEventStatus: (event: Event) => string;
}

export default function EventsGrid({ 
  events, 
  onEventClick, 
  onEditEvent, 
  onDeleteEvent, 
  getEventStatus 
}: EventsGridProps) {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onEventClick={onEventClick}
            onEditEvent={onEditEvent}
            onDeleteEvent={onDeleteEvent}
            getEventStatus={getEventStatus}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
