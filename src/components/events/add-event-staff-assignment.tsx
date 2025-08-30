
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";
import EnhancedMultiStaffSelector from "./enhanced-multi-staff-selector";
import { useStaff } from "@/hooks/use-staff";
import { getEnhancedStaffAvailability } from "@/hooks/staff/enhanced-staff-availability";

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
  ignoreScheduleConflicts = false
}: AddEventStaffAssignmentProps) {
  const { staff, leaveDates } = useStaff();
  const isDateTimeSelected = eventDate && startTime && endTime;

  // Get staff availability for videographers and photographers
  const staffAvailability = isDateTimeSelected && staff && eventDate && startTime && endTime
    ? getEnhancedStaffAvailability(
        staff,
        eventDate,
        startTime,
        endTime,
        ignoreScheduleConflicts,
        false, // ccsOnlyEvent
        leaveDates || []
      )
    : [];

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
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Date and time required</p>
              <p className="text-xs text-muted-foreground">
                Please select event date and time first to see available staff for assignment.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <EnhancedMultiStaffSelector
              role="Videographer"
              staffAvailability={staffAvailability}
              selectedStaffIds={selectedVideographers}
              onSelectionChange={onVideographersChange}
              excludeStaffIds={selectedPhotographers}
              eventStartTime={startTime}
              eventEndTime={endTime}
            />
            
            <EnhancedMultiStaffSelector
              role="Photographer"
              staffAvailability={staffAvailability}
              selectedStaffIds={selectedPhotographers}
              onSelectionChange={onPhotographersChange}
              excludeStaffIds={selectedVideographers}
              eventStartTime={startTime}
              eventEndTime={endTime}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
