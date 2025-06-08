
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/use-events";
import { Event } from "@/types/models";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventsHeader from "@/components/events/events-header";
import EventsFilters from "@/components/events/events-filters";
import EventsGrid from "@/components/events/events-grid";
import EventsList from "@/components/events/events-list";
import EventsEmptyState from "@/components/events/events-empty-state";

type ViewMode = "card" | "list";
type SortOption = "name" | "date" | "status";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const navigate = useNavigate();
  const { events, loading, loadEvents } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Function to get dynamic event status based on current time
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const startTime = new Date(`${event.date}T${event.startTime}`);
    const endTime = new Date(`${event.date}T${event.endTime}`);

    if (now > endTime) {
      return "Elapsed";
    } else if (now >= startTime && now <= endTime) {
      return "On Going";
    } else {
      return event.status; // Keep original status for future events
    }
  };

  // Filter and sort events
  const filteredAndSortedEvents = events
    .filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.logId.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "status":
          const statusA = getEventStatus(a);
          const statusB = getEventStatus(b);
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

  const handleEventClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  const handleEditEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleDeleteEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <EventsHeader loading={loading} onRefresh={loadEvents} />
      
      <div className="p-4 flex flex-col space-y-4">
        <EventsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-lg">Loading events...</p>
            </div>
          </div>
        ) : filteredAndSortedEvents.length > 0 ? (
          viewMode === "card" ? (
            <EventsGrid
              events={filteredAndSortedEvents}
              onEventClick={handleEventClick}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              getEventStatus={getEventStatus}
            />
          ) : (
            <EventsList
              events={filteredAndSortedEvents}
              onEventClick={handleEventClick}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              getEventStatus={getEventStatus}
            />
          )
        ) : (
          <EventsEmptyState searchQuery={searchQuery} />
        )}
      </div>

      {/* Edit Event Dialog */}
      {selectedEvent && (
        <EventEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          event={selectedEvent}
          onEventUpdated={loadEvents}
        />
      )}

      {/* Delete Event Dialog */}
      {selectedEvent && (
        <EventDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          event={selectedEvent}
          onEventDeleted={loadEvents}
        />
      )}
    </div>
  );
}
