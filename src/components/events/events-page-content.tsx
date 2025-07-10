
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

interface EventFilters {
  search: string;
  type: string;
  status: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function EventsPageContent({
  events,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  getEventStatus
}: EventsPageContentProps) {
  const [filters, setFilters] = useState<EventFilters>({
    search: "",
    type: "all",
    status: "all",
    dateRange: "all",
    sortBy: "date",
    sortOrder: "asc"
  });

  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const handleFiltersChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
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
    const matchesSearch = filters.search === "" || 
      event.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.location.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === "all" || event.type === filters.type;
    
    const matchesStatus = filters.status === "all" || getEventStatus(event) === filters.status;
    
    const eventDate = new Date(event.date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let matchesDateRange = true;
    if (filters.dateRange === "today") {
      matchesDateRange = eventDate.toDateString() === today.toDateString();
    } else if (filters.dateRange === "week") {
      matchesDateRange = eventDate >= thisWeek;
    } else if (filters.dateRange === "month") {
      matchesDateRange = eventDate >= thisMonth;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDateRange;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let comparison = 0;
    
    if (filters.sortBy === "date") {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (filters.sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (filters.sortBy === "type") {
      comparison = a.type.localeCompare(b.type);
    }
    
    return filters.sortOrder === "desc" ? -comparison : comparison;
  });

  const filteredAndSortedEvents = sortedEvents;
  const searchQuery = filters.search;

  // Group events by month and year
  const groupedEvents = filteredAndSortedEvents.reduce((groups, event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
    
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <div className="h-full" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="flex-shrink-0 p-4 md:p-6 border-b">
        <EventsPageFilters onFiltersChange={handleFiltersChange} />
      </div>

      <div className="flex-1" style={{ minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="p-4 md:p-6">
          {filteredAndSortedEvents.length === 0 ? (
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
