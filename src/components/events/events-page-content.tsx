
import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsFilters from "./events-filters";
import EventsGrid from "./events-grid";
import EventsList from "./events-list";
import { Event } from "@/types/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Grid, List, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import MonthlyReportButton from "./monthly-report-button";

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
  getEventStatus,
}: EventsPageContentProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const typeMatch = filterType === "all" || event.type === filterType;
      const statusMatch = filterStatus === "all" || getEventStatus(event) === filterStatus;
      
      // Filter by selected month
      const eventDate = parseISO(event.date);
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const monthMatch = eventDate >= monthStart && eventDate <= monthEnd;
      
      return typeMatch && statusMatch && monthMatch;
    });
  }, [events, filterType, filterStatus, selectedMonth, getEventStatus]);

  // Get all events for the selected month (for the report)
  const monthlyEvents = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });
  }, [events, selectedMonth]);

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first event
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Filters and Controls */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex flex-col gap-4">
            {/* Month selector and report button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <input
                  type="month"
                  value={format(selectedMonth, 'yyyy-MM')}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
                  className="px-3 py-1 border rounded-md text-sm"
                />
                <Badge variant="outline" className="text-xs">
                  {filteredEvents.length} events
                </Badge>
              </div>
              <MonthlyReportButton 
                events={monthlyEvents} 
                selectedMonth={selectedMonth} 
              />
            </div>
            
            {/* Filters */}
            <EventsFilters
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
            />
            
            {/* View Mode Toggle */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Events Content */}
        <div className="flex-1 overflow-auto">
          {filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No events found for {format(selectedMonth, 'MMMM yyyy')} with the current filters
                </p>
              </div>
            </div>
          ) : (
            <>
              {isMobile || viewMode === "list" ? (
                <EventsList
                  events={filteredEvents}
                  onEventClick={onEventClick}
                  onEditEvent={onEditEvent}
                  onDeleteEvent={onDeleteEvent}
                  getEventStatus={getEventStatus}
                />
              ) : (
                <EventsGrid
                  events={filteredEvents}
                  onEventClick={onEventClick}
                  onEditEvent={onEditEvent}
                  onDeleteEvent={onDeleteEvent}
                  getEventStatus={getEventStatus}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
