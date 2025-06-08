
import { ScrollArea } from "@/components/ui/scroll-area";
import EventListItem from "./event-list-item";
import { Event } from "@/types/models";

interface EventsListProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEditEvent: (e: React.MouseEvent, event: Event) => void;
  onDeleteEvent: (e: React.MouseEvent, event: Event) => void;
  getEventStatus: (event: Event) => string;
}

export default function EventsList({ 
  events, 
  onEventClick, 
  onEditEvent, 
  onDeleteEvent, 
  getEventStatus 
}: EventsListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-3 px-1">
        {events.map(event => (
          <EventListItem
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
