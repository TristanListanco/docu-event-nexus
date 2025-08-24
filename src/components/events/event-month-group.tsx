
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsGrid from "./events-grid";
import EventsList from "./events-list";
import { Event } from "@/types/models";

interface EventMonthGroupProps {
  monthYear: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEditEvent: (e: React.MouseEvent, event: Event) => void;
  onDeleteEvent: (e: React.MouseEvent, event: Event) => void;
  getEventStatus: (event: Event) => string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  defaultExpanded?: boolean;
}

export default function EventMonthGroup({
  monthYear,
  events,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  getEventStatus,
  isCollapsed,
  onToggleCollapse,
  defaultExpanded = true
}: EventMonthGroupProps) {
  const isMobile = useIsMobile();

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm">
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">{monthYear}</h2>
                <p className="text-sm text-muted-foreground">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ChevronRight 
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                isCollapsed ? 'rotate-0' : 'rotate-90'
              }`}
            />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="border-t border-border">
          <div className="p-4">
            {isMobile ? (
              <EventsGrid
                events={events}
                onEventClick={onEventClick}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
                getEventStatus={getEventStatus}
              />
            ) : (
              <EventsList
                events={events}
                onEventClick={onEventClick}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
                getEventStatus={getEventStatus}
              />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
