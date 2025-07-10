
import { useState, useEffect } from "react";
import { Event } from "@/types/models";
import EventsEmptyState from "./events-empty-state";
import EventsPageFilters from "./events-page-filters";
import EventMonthGroup from "./event-month-group";

interface EventsPageContentProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
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
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [filterBy, setFilterBy] = useState<"all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled">("all");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const handleFiltersChange = (filters: {
    searchQuery: string;
    sortBy: "date" | "name" | "status";
    filterBy: "all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled";
  }) => {
    setSearchQuery(filters.searchQuery);
    setSortBy(filters.sortBy);
    setFilterBy(filters.filterBy);
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event);
    onEventClick(event);
  };

  const handleEditEvent = (event: Event) => {
    console.log('Edit event:', event);
    onEditEvent(event);
  };

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

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === "" || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === "all" || getEventStatus(event).toLowerCase() === filterBy.replace(" ", "").toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "date") {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "status") {
      comparison = getEventStatus(a).localeCompare(getEventStatus(b));
    }
    
    return comparison;
  });

  // Group events by month and year
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
    
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 md:p-6 border-b">
        <EventsPageFilters onFiltersChange={handleFiltersChange} />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          {sortedEvents.length === 0 ? (
            <EventsEmptyState searchQuery={searchQuery} />
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                <EventMonthGroup
                  key={monthYear}
                  monthYear={monthYear}
                  events={monthEvents}
                  onEventClick={handleEventClick}
                  onEditEvent={handleEditEvent}
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
    </div>
  );
}
