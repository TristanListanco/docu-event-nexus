
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/use-events";
import EventsHeader from "@/components/events/events-header";
import EventsPageContent from "@/components/events/events-page-content";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import { getEventStatus } from "@/components/events/event-status-utils";
import { Event } from "@/types/models";

export default function EventsPage() {
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleEventClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  const handleEditEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    handleEdit(event);
  };

  const handleDeleteEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    handleDelete(event);
  };

  const handleEventUpdated = () => {
    // Events list will auto-refresh through the hook
  };

  const handleEventDeleted = () => {
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
      <EventsHeader />
      
      <EventsPageContent
        events={events}
        onEventClick={handleEventClick}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
        getEventStatus={getEventStatus}
      />

      {selectedEvent && (
        <>
          <EventEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            event={selectedEvent}
            onEventUpdated={handleEventUpdated}
          />
          
          <EventDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            event={selectedEvent}
            onEventDeleted={handleEventDeleted}
          />
        </>
      )}
    </div>
  );
}
