
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
  const hasRenderedRef = useRef(false);

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

  // Only show loading skeleton on initial load, not on subsequent re-renders
  if (loading && !hasRenderedRef.current) {
    return <EventsPageSkeleton />;
  }

  // Mark that we've rendered at least once
  if (!hasRenderedRef.current) {
    hasRenderedRef.current = true;
  }

  return (
    <div className="flex h-screen flex-col animate-fade-in">
      <div className="animate-slide-in-right">
        <EventsHeader 
          onAddEvent={handleAddEvent} 
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
      
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
