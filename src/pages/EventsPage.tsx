import { useState } from "react";
import { useEvents } from "@/hooks/use-events";
import EventsHeader from "@/components/events/events-header";
import EventsFilters from "@/components/events/events-filters";
import EventsGrid from "@/components/events/events-grid";
import EventsList from "@/components/events/events-list";
import EventsEmptyState from "@/components/events/events-empty-state";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import { Event, EventType, EventStatus } from "@/types/models";

export default function EventsPage() {
  const { events, loading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<EventType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "All">("All");
  const [sortBy, setSortBy] = useState<"date" | "name" | "type">("date");

  // Filter and sort events based on selected criteria
  const filteredAndSortedEvents = events
    .filter((event) => {
      if (filterType !== "All" && event.type !== filterType) return false;
      if (filterStatus !== "All" && event.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "date":
        default:
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleEventUpdated = () => {
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
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <EventsFilters
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />

          {events.length === 0 ? (
            <EventsEmptyState />
          ) : (
            <>
              {viewMode === "grid" ? (
                <EventsGrid
                  events={filteredAndSortedEvents}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : (
                <EventsList
                  events={filteredAndSortedEvents}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </>
          )}
        </div>
      </div>

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
          />
        </>
      )}
    </div>
  );
}
