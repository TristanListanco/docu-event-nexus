
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
        isFullyAvailable: false,
        conflictingTimeSlots: [{
          startTime,
          endTime,
          reason: "On leave"
        }]
      };
    }

    // If ignoreScheduleConflicts is true, only check CCS-only constraint and leave dates
    if (ignoreScheduleConflicts) {
      // For CCS-only events, exclude working committee members
      if (ccsOnlyEvent && member.roles.includes('Working Com')) {
        return {
          staff: member,
          isFullyAvailable: false,
          conflictingTimeSlots: [{
            startTime,
            endTime,
            reason: "CCS classes suspended - Working Committee members excluded"
          }]
        };
      }

      return {
        staff: member,
        isFullyAvailable: true
      };
    }

    // Normal availability check with all constraints
    return isStaffAvailable(member, eventDate, startTime, endTime, ccsOnlyEvent);
  });
};

export const getSmartStaffAllocation = (
  staffAvailability: StaffAvailability[],
  eventStartTime: string,
  eventEndTime: string
): { recommendedStaff: string[]; coverage: number } => {
  // Filter for fully available staff first
  const fullyAvailable = staffAvailability.filter(s => s.isFullyAvailable);
  
  if (fullyAvailable.length > 0) {
    return {
      recommendedStaff: [fullyAvailable[0].staff.id],
      coverage: 100
    };
  }

  // If no fully available staff, try to find the best partial coverage
  const partiallyAvailable = staffAvailability.filter(s => 
    !s.isFullyAvailable && s.availableTimeSlots && s.availableTimeSlots.length > 0
  );

  if (partiallyAvailable.length === 0) {
    return {
      recommendedStaff: [],
      coverage: 0
    };
  }

  // Simple heuristic: pick the staff member with the most available time
  const bestOption = partiallyAvailable.reduce((best, current) => {
    const currentCoverage = current.availableTimeSlots?.reduce((sum, slot) => {
      const slotDuration = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
      return sum + slotDuration;
    }, 0) || 0;

    const bestCoverage = best.availableTimeSlots?.reduce((sum, slot) => {
      const slotDuration = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
      return sum + slotDuration;
    }, 0) || 0;

    return currentCoverage > bestCoverage ? current : best;
  });

  const eventDuration = timeToMinutes(eventEndTime) - timeToMinutes(eventStartTime);
  const availableDuration = bestOption.availableTimeSlots?.reduce((sum, slot) => {
    const slotDuration = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
    return sum + slotDuration;
  }, 0) || 0;

  const coverage = Math.round((availableDuration / eventDuration) * 100);

  return {
    recommendedStaff: [bestOption.staff.id],
    coverage
  };
};

// Helper function for time calculations
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};
