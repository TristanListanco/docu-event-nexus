
import { Event } from "@/types/models";
import EventCard from "./event-card";

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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
  );
}
