
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Event } from "@/types/models";

interface EventCardProps {
  event: Event;
  onEventClick: (event: Event) => void;
  onEditEvent: (e: React.MouseEvent, event: Event) => void;
  onDeleteEvent: (e: React.MouseEvent, event: Event) => void;
  getEventStatus: (event: Event) => string;
  isArchived?: boolean;
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

export default function EventCard({ 
  event, 
  onEventClick, 
  getEventStatus,
  isArchived = false
}: EventCardProps) {
  const dynamicStatus = getEventStatus(event);
  const shouldShowStatus = !(isArchived && dynamicStatus === 'Elapsed');

  return (
    <Card 
      className="cursor-pointer hover-lift transition-all duration-300 animate-fade-in-up border-border/50 hover:border-primary/20"
      onClick={() => onEventClick(event)}
    >
      <CardHeader className="pb-2">
        <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center transition-colors duration-200 hover:bg-primary/20">
          <Calendar className="h-5 w-5 text-primary transition-transform duration-200 hover:scale-110" />
        </div>
        <CardTitle className="mt-2 transition-colors duration-200 hover:text-primary">{event.name}</CardTitle>
        <p className="text-muted-foreground text-sm transition-colors duration-200">
          {event.date ? format(new Date(event.date.replace(/-/g, '/')), 'MMM d, yyyy') : 'No date'}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm transition-colors duration-200 hover:text-foreground">📍 {event.location}</p>
        <p className="text-sm transition-colors duration-200 hover:text-foreground">🕒 {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}</p>
        {shouldShowStatus && (
          <div className="flex justify-start mt-2">
            <Badge className={`${getStatusBadgeColor(dynamicStatus)} transition-all duration-200 hover:scale-105`}>
              {dynamicStatus}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
