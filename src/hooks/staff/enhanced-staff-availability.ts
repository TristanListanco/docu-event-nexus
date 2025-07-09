
import { StaffMember, StaffAvailability } from "@/types/models";
import { isStaffAvailable } from "./staff-availability";

interface LeaveDate {
  staff_id: string;
  start_date: string;
  end_date: string;
}

export const getEnhancedStaffAvailability = (
  staff: StaffMember[],
  eventDate: string,
  startTime: string,
  endTime: string,
  ignoreScheduleConflicts: boolean = false,
  ccsOnlyEvent: boolean = false,
  leaveDates: LeaveDate[] = []
): StaffAvailability[] => {
  return staff.map(member => {
    // Always check for leave dates regardless of ignore conflicts setting
    const isOnLeave = leaveDates.some(leave => {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      const eventDateObj = new Date(eventDate);
      
      return leave.staff_id === member.id && 
             eventDateObj >= leaveStart && 
             eventDateObj <= leaveEnd;
    });

    if (isOnLeave) {
      return {
        staff: member,
        isAvailable: false,
        reason: "On leave",
        conflicts: []
      };
    }

    // If ignoreScheduleConflicts is true, only check CCS-only constraint and leave dates
    if (ignoreScheduleConflicts) {
      // For CCS-only events, exclude working committee members
      if (ccsOnlyEvent && member.role === 'Working Com') {
        return {
          staff: member,
          isAvailable: false,
          reason: "CCS classes suspended - Working Committee members excluded",
          conflicts: []
        };
      }

      return {
        staff: member,
        isAvailable: true,
        reason: "Available (conflicts ignored)",
        conflicts: []
      };
    }

    // Normal availability check with all constraints
    return isStaffAvailable(member, eventDate, startTime, endTime, ccsOnlyEvent);
  });
};
