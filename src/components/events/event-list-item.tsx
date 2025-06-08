
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Trash2, MoreVertical } from "lucide-react";
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
  onEditEvent, 
  onDeleteEvent, 
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => onEditEvent(e, event)}>
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => onDeleteEvent(e, event)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Event</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
