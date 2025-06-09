
import { useState } from "react";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import { Event } from "@/types/models";

interface EventActionsManagerProps {
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

export default function EventActionsManager({
  onEventUpdated,
  onEventDeleted
}: EventActionsManagerProps) {
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

  const createEditHandler = () => (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    handleEdit(event);
  };

  const createDeleteHandler = () => (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    handleDelete(event);
  };

  return {
    selectedEvent,
    editDialogOpen,
    deleteDialogOpen,
    setEditDialogOpen,
    setDeleteDialogOpen,
    editHandler: createEditHandler(),
    deleteHandler: createDeleteHandler(),
    dialogs: selectedEvent ? (
      <>
        <EventEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          event={selectedEvent}
          onEventUpdated={onEventUpdated}
        />
        
        <EventDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          event={selectedEvent}
          onEventDeleted={onEventDeleted}
        />
      </>
    ) : null
  };
}
