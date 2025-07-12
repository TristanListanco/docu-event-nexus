
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface AssignmentData {
  id: string;
  eventName: string;
  staffName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface AssignmentDetailsProps {
  assignment: AssignmentData;
  confirmationTimestamp?: string;
  status: string;
}

const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy \'at\' h:mm a');
  } catch (error) {
    return dateString;
  }
};

export function AssignmentDetails({ assignment, confirmationTimestamp, status }: AssignmentDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Event Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{assignment?.eventName}</h3>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{assignment?.eventDate && format(new Date(assignment.eventDate), 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{assignment?.startTime} - {assignment?.endTime}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{assignment?.location}</span>
          </div>
        </div>
      </div>

      {/* Staff Information */}
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">Assigned to:</p>
        <p className="font-medium">{assignment?.staffName}</p>
      </div>

      {/* Confirmation Timestamp */}
      {confirmationTimestamp && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {status === 'confirmed' ? 'Confirmed on:' : 'Declined on:'}
          </p>
          <p className="font-medium">{formatDateTime(confirmationTimestamp)}</p>
        </div>
      )}
    </div>
  );
}
