
import { useState, useEffect } from "react";
import { Event } from "@/types/models";
import EventsEmptyState from "./events-empty-state";
import EventsPageFilters from "./events-page-filters";
import EventMonthGroup from "./event-month-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Calendar } from "lucide-react";

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
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [filterBy, setFilterBy] = useState<"all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled">("all");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("active");

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

  const handleEditEvent = (e: React.MouseEvent, event: Event) => {
    console.log('Edit event:', event);
    onEditEvent(e, event);
  };

  const handleDeleteEvent = (e: React.MouseEvent, event: Event) => {
    console.log('Delete event:', event);
    onDeleteEvent(e, event);
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

  // Separate active and archived events
  const activeEvents = events.filter(event => {
    const status = getEventStatus(event).toLowerCase();
    return status !== "elapsed" && status !== "completed";
  });

  const archivedEvents = events.filter(event => {
    const status = getEventStatus(event).toLowerCase();
    return status === "elapsed" || status === "completed";
  });

  // Filter events based on current filters and active tab
  const currentEvents = activeTab === "active" ? activeEvents : archivedEvents;
  
  const filteredEvents = currentEvents.filter(event => {
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
      // Safari-safe date parsing
      const dateA = new Date(a.date.replace(/-/g, '/'));
      const dateB = new Date(b.date.replace(/-/g, '/'));
      comparison = dateA.getTime() - dateB.getTime();
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "status") {
      comparison = getEventStatus(a).localeCompare(getEventStatus(b));
    }
    
    // For archived events, reverse the date order to show current month at top
    if (activeTab === "archived" && sortBy === "date") {
      comparison = -comparison;
    }
    
    return comparison;
  });

  // Group events by month and year
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    // Safari-safe date parsing
    const date = new Date(event.date.replace(/-/g, '/'));
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
    
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-shrink-0 p-4 md:p-6 border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col space-y-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Active Events ({activeEvents.length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archived ({archivedEvents.length})
              </TabsTrigger>
            </TabsList>
            
            <EventsPageFilters 
              onFiltersChange={handleFiltersChange} 
              isArchived={activeTab === "archived"}
            />
          </div>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          {sortedEvents.length === 0 ? (
            <EventsEmptyState 
              searchQuery={searchQuery} 
              isArchived={activeTab === "archived"}
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                <EventMonthGroup
                  key={monthYear}
                  monthYear={monthYear}
                  events={monthEvents}
                  onEventClick={handleEventClick}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleDeleteEvent}
                  getEventStatus={getEventStatus}
                  isCollapsed={collapsedMonths.has(monthYear)}
                  onToggleCollapse={() => toggleMonthCollapse(monthYear)}
                  defaultExpanded={true}
                  isArchived={activeTab === "archived"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
