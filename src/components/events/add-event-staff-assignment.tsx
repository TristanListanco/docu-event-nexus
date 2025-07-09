
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";
import EnhancedMultiStaffSelector from "./enhanced-multi-staff-selector";

interface AddEventStaffAssignmentProps {
  selectedVideographers: string[];
  selectedPhotographers: string[];
  onVideographersChange: (videographers: string[]) => void;
  onPhotographersChange: (photographers: string[]) => void;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  ignoreScheduleConflicts?: boolean;
}

export default function AddEventStaffAssignment({
  selectedVideographers,
  selectedPhotographers,
  onVideographersChange,
  onPhotographersChange,
  eventDate,
  startTime,
  endTime,
  ignoreScheduleConflicts
}: AddEventStaffAssignmentProps) {
  const isDateTimeSelected = eventDate && startTime && endTime;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDateTimeSelected ? (
          <div className="flex items-center gap-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-muted-foreground/20">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date and time required</p>
              <p className="text-xs text-muted-foreground/70">
                Please select event date and time first to see available staff for assignment.
              </p>
            </div>
          </div>
        ) : (
          <EnhancedMultiStaffSelector
            selectedVideographers={selectedVideographers}
            selectedPhotographers={selectedPhotographers}
            onVideographersChange={onVideographersChange}
            onPhotographersChange={onPhotographersChange}
            eventDate={eventDate}
            startTime={startTime}
            endTime={endTime}
            ignoreScheduleConflicts={ignoreScheduleConflicts}
          />
        )}
      </CardContent>
    </Card>
  );
}
