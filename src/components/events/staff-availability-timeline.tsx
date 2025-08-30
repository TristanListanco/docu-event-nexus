
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Clock, User } from "lucide-react";
import { StaffAvailability } from "@/types/models";
import { getEnhancedStaffAvailability } from "@/hooks/staff/enhanced-staff-availability";
import { useStaff } from "@/hooks/use-staff";

interface StaffAvailabilityTimelineProps {
  assignedVideographers: string[];
  assignedPhotographers: string[];
  eventDate: string;
  startTime: string;
  endTime: string;
}

const formatTimeSlots = (slots: Array<{startTime: string; endTime: string}>) => {
  return slots.map(slot => `${slot.startTime}-${slot.endTime}`).join(", ");
};

const getAvailabilityStatus = (availability: StaffAvailability) => {
  if (availability.isFullyAvailable) {
    return { status: "Full Coverage", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
  } else if (availability.availableTimeSlots && availability.availableTimeSlots.length > 0) {
    return { status: "Partial Coverage", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
  } else {
    return { status: "Not Available", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
  }
};

export default function StaffAvailabilityTimeline({
  assignedVideographers,
  assignedPhotographers,
  eventDate,
  startTime,
  endTime
}: StaffAvailabilityTimelineProps) {
  const { staff, leaveDates } = useStaff();

  if (!staff || !eventDate || !startTime || !endTime) {
    return null;
  }

  // Get availability for all assigned staff
  const allAssignedStaffIds = [...assignedVideographers, ...assignedPhotographers];
  const assignedStaff = staff.filter(member => allAssignedStaffIds.includes(member.id));
  
  const staffAvailability = getEnhancedStaffAvailability(
    assignedStaff,
    eventDate,
    startTime,
    endTime,
    false, // don't ignore conflicts
    false, // not CCS only
    leaveDates || []
  );

  // Group staff by role
  const videographerAvailability = staffAvailability.filter(availability => 
    assignedVideographers.includes(availability.staff.id)
  );
  
  const photographerAvailability = staffAvailability.filter(availability => 
    assignedPhotographers.includes(availability.staff.id)
  );

  // Sort by availability status (fully available first, then partially available, then unavailable)
  const sortByAvailability = (a: StaffAvailability, b: StaffAvailability) => {
    if (a.isFullyAvailable && !b.isFullyAvailable) return -1;
    if (!a.isFullyAvailable && b.isFullyAvailable) return 1;
    
    const aHasSlots = a.availableTimeSlots && a.availableTimeSlots.length > 0;
    const bHasSlots = b.availableTimeSlots && b.availableTimeSlots.length > 0;
    
    if (aHasSlots && !bHasSlots) return -1;
    if (!aHasSlots && bHasSlots) return 1;
    
    return 0;
  };

  videographerAvailability.sort(sortByAvailability);
  photographerAvailability.sort(sortByAvailability);

  const renderStaffGroup = (
    title: string, 
    icon: React.ReactNode, 
    availability: StaffAvailability[]
  ) => {
    if (availability.length === 0) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-sm">No {title.toLowerCase()} assigned</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title} ({availability.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.map((staffAvail) => {
            const { status, color } = getAvailabilityStatus(staffAvail);
            
            return (
              <div key={staffAvail.staff.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{staffAvail.staff.name}</span>
                  </div>
                  <Badge variant="secondary" className={color}>
                    {status}
                  </Badge>
                </div>
                
                {staffAvail.isFullyAvailable ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Clock className="h-3 w-3" />
                    <span>Available for entire event ({startTime} - {endTime})</span>
                  </div>
                ) : staffAvail.availableTimeSlots && staffAvail.availableTimeSlots.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                      <Clock className="h-3 w-3" />
                      <span>Available time slots:</span>
                    </div>
                    <div className="ml-5 text-sm">
                      {formatTimeSlots(staffAvail.availableTimeSlots)}
                    </div>
                    {staffAvail.conflictingTimeSlots && (
                      <div className="ml-5 text-xs text-red-600 dark:text-red-400">
                        Conflicts: {staffAvail.conflictingTimeSlots.map(c => 
                          `${c.startTime}-${c.endTime} (${c.reason})`
                        ).join(", ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <Clock className="h-3 w-3" />
                      <span>Not available during event time</span>
                    </div>
                    {staffAvail.conflictingTimeSlots && (
                      <div className="ml-5 text-xs text-red-600 dark:text-red-400">
                        Conflicts: {staffAvail.conflictingTimeSlots.map(c => 
                          `${c.startTime}-${c.endTime} (${c.reason})`
                        ).join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Staff Availability Timeline</h3>
        <Badge variant="outline" className="text-xs">
          {eventDate} • {startTime} - {endTime}
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {renderStaffGroup(
          "Videographers", 
          <Video className="h-4 w-4 text-primary" />, 
          videographerAvailability
        )}
        
        {renderStaffGroup(
          "Photographers", 
          <Camera className="h-4 w-4 text-primary" />, 
          photographerAvailability
        )}
      </div>
    </div>
  );
}
