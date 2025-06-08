
import { Event } from "@/types/models";
import EventListItem from "./event-list-item";

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
    <div className="space-y-2">
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
  );
}
