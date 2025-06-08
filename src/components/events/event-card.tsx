
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Event } from "@/types/models";

interface EventCardProps {
  event: Event;
  onEventClick: (event: Event) => void;
  onEditEvent: (e: React.MouseEvent, event: Event) => void;
  onDeleteEvent: (e: React.MouseEvent, event: Event) => void;
  getEventStatus: (event: Event) => string;
}

export default function EventCard({ 
  event, 
  onEventClick, 
  onEditEvent, 
  onDeleteEvent, 
  getEventStatus 
}: EventCardProps) {
  const dynamicStatus = getEventStatus(event);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onEventClick(event)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex space-x-1">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {event.type}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Open menu</span>
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => onEditEvent(e, event)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Event</span>
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
        <CardTitle className="mt-2">{event.name}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'No date'}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm">📍 {event.location}</p>
        <p className="text-sm">🕒 {event.startTime} - {event.endTime}</p>
        <div className="flex justify-between mt-2">
          <Badge className={`
            ${dynamicStatus === 'Upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
             dynamicStatus === 'On Going' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' :
             dynamicStatus === 'Elapsed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
             'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}
          `}>
            {dynamicStatus}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Log ID: {event.logId}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
