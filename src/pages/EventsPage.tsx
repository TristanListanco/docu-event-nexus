
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/events/use-events";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsHeader from "@/components/events/events-header";
import EventsPageContent from "@/components/events/events-page-content";
import EventActionsManager from "@/components/events/event-actions-manager";
import AddEventDialog from "@/components/events/add-event-dialog";
import AddEventSheet from "@/components/events/add-event-sheet";
import { getEventStatus } from "@/components/events/event-status-utils";
import { Event } from "@/types/models";

export default function EventsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events, loading } = useEvents();
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [addEventSheetOpen, setAddEventSheetOpen] = useState(false);

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

  const handleAddEvent = () => {
    if (isMobile) {
      setAddEventSheetOpen(true);
    } else {
      setAddEventDialogOpen(true);
    }
  };

  const handleEventAdded = () => {
    // Events list will auto-refresh through the hook
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
      <EventsHeader onAddEvent={handleAddEvent} />
      
      <EventsPageContent
        events={events}
        onEventClick={handleEventClick}
        onEditEvent={eventActions.editHandler}
        onDeleteEvent={eventActions.deleteHandler}
        getEventStatus={getEventStatus}
      />

      {/* Desktop Dialog */}
      <AddEventDialog
        open={addEventDialogOpen}
        onOpenChange={setAddEventDialogOpen}
        onEventAdded={handleEventAdded}
      />

      {/* Mobile/Tablet Sheet */}
      <AddEventSheet
        open={addEventSheetOpen}
        onOpenChange={setAddEventSheetOpen}
        onEventAdded={handleEventAdded}
      />

      {eventActions.dialogs}
    </div>
  );
}
