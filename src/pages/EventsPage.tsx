
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/events/use-events";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsHeader from "@/components/events/events-header";
import EventsPageContent from "@/components/events/events-page-content";
import EventActionsManager from "@/components/events/event-actions-manager";
import AddEventDialog from "@/components/events/add-event-dialog";
import AddEventSheet from "@/components/events/add-event-sheet";
import EventsPageSkeleton from "@/components/loading/events-page-skeleton";
import { getEventStatus } from "@/components/events/event-status-utils";
import { Event } from "@/types/models";

export default function EventsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events, loading, loadEvents } = useEvents();
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [addEventSheetOpen, setAddEventSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading skeleton while loading
  if (loading) {
    return <EventsPageSkeleton />;
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <EventsHeader 
        onAddEvent={handleAddEvent} 
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      <div className="flex-1 overflow-hidden">
        <EventsPageContent
          events={events}
          onEventClick={handleEventClick}
          onEditEvent={eventActions.editHandler}
          onDeleteEvent={eventActions.deleteHandler}
          getEventStatus={getEventStatus}
        />
      </div>

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
