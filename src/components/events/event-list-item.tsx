import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Event } from "@/types/models";

interface EventListItemProps {
  event: Event;
  onEventClick: (event: Event) => void;
  onEditEvent: (e: React.MouseEvent, event: Event) => void;
  onDeleteEvent: (e: React.MouseEvent, event: Event) => void;
  getEventStatus: (event: Event) => string;
}

// Helper function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to get status badge colors
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Upcoming':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300';
    case 'On Going':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300';
    case 'Elapsed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300';
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300';
  }
};

export default function EventListItem({ 
  event, 
  onEventClick, 
  getEventStatus 
}: EventListItemProps) {
  const dynamicStatus = getEventStatus(event);

  return (
    <Card 
      className="cursor-pointer hover-lift transition-all duration-300 animate-fade-in border-border/50 hover:border-primary/20"
      onClick={() => onEventClick(event)}
    >
      <CardContent className="p-4">
        {/* Mobile Layout */}
        <div className="flex flex-col space-y-3 sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors duration-200 hover:bg-primary/20">
                <Calendar className="h-4 w-4 text-primary transition-transform duration-200 hover:scale-110" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate transition-colors duration-200 hover:text-primary">{event.name}</h3>
              </div>
            </div>
            <Badge className={`${getStatusBadgeColor(dynamicStatus)} transition-all duration-200 hover:scale-105`}>
              {dynamicStatus}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-primary/10 text-primary text-xs transition-colors duration-200 hover:bg-primary/20">
              {event.type}
            </Badge>
          </div>
          
          {/* Mobile: Each item on separate line */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
              <span>🗓️ {event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'No date'}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
              <span>🕒 {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
              <span className="flex items-center">📍 <span className="ml-1 truncate max-w-[200px]" title={event.location}>{event.location}</span></span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors duration-200 hover:bg-primary/20">
              <Calendar className="h-4 w-4 text-primary transition-transform duration-200 hover:scale-110" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium truncate transition-colors duration-200 hover:text-primary">{event.name}</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary text-xs flex-shrink-0 transition-colors duration-200 hover:bg-primary/20">
                  {event.type}
                </Badge>
              </div>
              {/* Desktop: Each item on separate line for better readability */}
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                  <span>🗓️ {event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'No date'}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                  <span>🕒 {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                  <span className="flex items-center">📍 <span className="ml-1 truncate max-w-[300px] lg:max-w-[400px]" title={event.location}>{event.location}</span></span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge className={`${getStatusBadgeColor(dynamicStatus)} transition-all duration-200 hover:scale-105`}>
              {dynamicStatus}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
