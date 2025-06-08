
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

export default function EventListItem({ 
  event, 
  onEventClick, 
  getEventStatus 
}: EventListItemProps) {
  const dynamicStatus = getEventStatus(event);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onEventClick(event)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium truncate">{event.name}</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary text-xs flex-shrink-0">
                  {event.type}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1 flex-wrap">
                <span className="flex items-center">📍 <span className="ml-1 truncate">{event.location}</span></span>
                <span className="flex-shrink-0">🕒 {event.startTime} - {event.endTime}</span>
                <span className="flex-shrink-0">{event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'No date'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge className={`
              ${dynamicStatus === 'Upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
               dynamicStatus === 'On Going' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' :
               dynamicStatus === 'Elapsed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
               'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}
            `}>
              {dynamicStatus}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
