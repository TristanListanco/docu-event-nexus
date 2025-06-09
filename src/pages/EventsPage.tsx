
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/use-events";
import EventsHeader from "@/components/events/events-header";
import EventsPageContent from "@/components/events/events-page-content";
import EventActionsManager from "@/components/events/event-actions-manager";
import { getEventStatus } from "@/components/events/event-status-utils";
import { Event } from "@/types/models";

export default function EventsPage() {
  const navigate = useNavigate();
  const { events, loading } = useEvents();

  const eventActions = EventActionsManager({
    onEventUpdated: () => {
      // Events list will auto-refresh through the hook
    },
    onEventDeleted: () => {
      // Events list will auto-refresh through the hook
    }
  });

  const handleEventClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <EventsHeader />
      
      <EventsPageContent
        events={events}
        onEventClick={handleEventClick}
        onEditEvent={eventActions.editHandler}
        onDeleteEvent={eventActions.deleteHandler}
        getEventStatus={getEventStatus}
      />

      {eventActions.dialogs}
    </div>
  );
}
