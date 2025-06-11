
import { useState } from "react";
import { format } from "date-fns";
import EventsPageFilters from "./events-page-filters";
import EventsEmptyState from "./events-empty-state";
import EventMonthGroup from "./event-month-group";
import { Event } from "@/types/models";

type FilterOption = "all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled";
type SortOption = "date" | "name" | "status";

interface EventsPageContentProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEditEvent: (e: React.MouseEvent, event: Event) => void;
  onDeleteEvent: (e: React.MouseEvent, event: Event) => void;
  getEventStatus: (event: Event) => string;
}

export default function EventsPageContent({
  events,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  getEventStatus
}: EventsPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const toggleMonthCollapse = (monthYear: string) => {
    setCollapsedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthYear)) {
        newSet.delete(monthYear);
      } else {
        newSet.add(monthYear);
      }
      return newSet;
    });
  };

  const handleFiltersChange = (filters: {
    searchQuery: string;
    sortBy: SortOption;
    filterBy: FilterOption;
  }) => {
    setSearchQuery(filters.searchQuery);
    setSortBy(filters.sortBy);
    setFilterBy(filters.filterBy);
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6">
        <EventsPageFilters onFiltersChange={handleFiltersChange} />

        {filteredAndSortedEvents.length === 0 ? (
          <EventsEmptyState searchQuery={searchQuery} />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
              <EventMonthGroup
                key={monthYear}
                monthYear={monthYear}
                events={monthEvents}
                onEventClick={onEventClick}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
                getEventStatus={getEventStatus}
                isCollapsed={collapsedMonths.has(monthYear)}
                onToggleCollapse={() => toggleMonthCollapse(monthYear)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
