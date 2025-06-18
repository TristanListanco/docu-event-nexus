
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
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
}

export default function EventMonthGroup({
  monthYear,
  events,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  getEventStatus,
  isCollapsed,
  onToggleCollapse
}: EventMonthGroupProps) {
  const isMobile = useIsMobile();

  return (
    <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
      <div className="space-y-0">
        <CollapsibleTrigger className="w-full">
          <div className="border-b border-border pb-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-md p-3 mb-4">
            <div className="text-left">
              <h2 className="text-xl font-semibold text-foreground">{monthYear}</h2>
              <p className="text-sm text-muted-foreground">{events.length} event{events.length !== 1 ? 's' : ''}</p>
            </div>
            <ChevronDown 
              className={`h-5 w-5 transition-transform duration-300 ease-in-out ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent 
          className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden"
          forceMount={false}
        >
          <div className="pb-6">
            {/* Mobile uses grid view, desktop/tablet uses list view */}
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
      </div>
    </Collapsible>
  );
}
