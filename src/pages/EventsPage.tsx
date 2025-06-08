
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/use-events";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsHeader from "@/components/events/events-header";
import EventsFilters from "@/components/events/events-filters";
import EventsGrid from "@/components/events/events-grid";
import EventsList from "@/components/events/events-list";
import EventsEmptyState from "@/components/events/events-empty-state";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import { Event, EventType, EventStatus } from "@/types/models";
import { format } from "date-fns";

type FilterOption = "all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled";

export default function EventsPage() {
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const eventStart = new Date(`${event.date}T${event.startTime}`);
    const eventEnd = new Date(`${event.date}T${event.endTime}`);

    if (now < eventStart) {
      return "Upcoming";
    } else if (now >= eventStart && now <= eventEnd) {
      return "On Going";
    } else {
      return "Elapsed";
    }
  };

  // Filter and sort events based on selected criteria
  const filteredAndSortedEvents = events
    .filter((event) => {
      // Search filter
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      if (filterBy === "all") {
        return matchesSearch;
      }
      
      const eventStatus = getEventStatus(event).toLowerCase().replace(" ", "");
      const filterStatus = filterBy.toLowerCase().replace(" ", "");
      
      return matchesSearch && eventStatus === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return getEventStatus(a).localeCompare(getEventStatus(b));
        case "date":
        default:
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });

  // Group events by month
  const groupedEvents = filteredAndSortedEvents.reduce((groups, event) => {
    const monthYear = format(new Date(event.date), 'MMMM yyyy');
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

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
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <EventsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterBy={filterBy}
            onFilterChange={setFilterBy}
          />

          {filteredAndSortedEvents.length === 0 ? (
            <EventsEmptyState searchQuery={searchQuery} />
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                <div key={monthYear} className="space-y-4">
                  <div className="border-b border-border pb-2">
                    <h2 className="text-xl font-semibold text-foreground">{monthYear}</h2>
                    <p className="text-sm text-muted-foreground">{monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}</p>
                  </div>
                  
                  {/* Mobile uses grid view, desktop/tablet uses list view */}
                  {isMobile ? (
                    <EventsGrid
                      events={monthEvents}
                      onEventClick={handleEventClick}
                      onEditEvent={handleEditEvent}
                      onDeleteEvent={handleDeleteEvent}
                      getEventStatus={getEventStatus}
                    />
                  ) : (
                    <EventsList
                      events={monthEvents}
                      onEventClick={handleEventClick}
                      onEditEvent={handleEditEvent}
                      onDeleteEvent={handleDeleteEvent}
                      getEventStatus={getEventStatus}
                    />
                  )}
                </div>
              ))}
            </div>
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
            onEventDeleted={handleEventDeleted}
          />
        </>
      )}
    </div>
  );
}
