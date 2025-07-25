import { StaffMember, StaffAvailability } from "@/types/models";

interface LeaveDate {
  staff_id: string;
  start_date: string;
  end_date: string;
}

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const calculateAvailableTimeSlots = (
  eventStartTime: string,
  eventEndTime: string,
  conflicts: Array<{startTime: string; endTime: string; reason: string}>
): Array<{startTime: string; endTime: string}> => {
  const eventStart = timeToMinutes(eventStartTime);
  const eventEnd = timeToMinutes(eventEndTime);
  
  // Sort conflicts by start time
  const sortedConflicts = conflicts
    .map(c => ({
      start: timeToMinutes(c.startTime),
      end: timeToMinutes(c.endTime)
    }))
    .sort((a, b) => a.start - b.start);
  
  const availableSlots: Array<{startTime: string; endTime: string}> = [];
  let currentTime = eventStart;
  
  for (const conflict of sortedConflicts) {
    // If there's a gap before this conflict, add it as available time
    if (currentTime < conflict.start) {
      availableSlots.push({
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(conflict.start)
      });
    }
    // Move current time to after this conflict
    currentTime = Math.max(currentTime, conflict.end);
  }
  
  // If there's time left after all conflicts, add it as available
  if (currentTime < eventEnd) {
    availableSlots.push({
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(eventEnd)
    });
  }
  
  return availableSlots;
};

export const getEnhancedStaffAvailability = (
  staff: StaffMember[],
  eventDate: string,
  startTime: string,
  endTime: string,
  ignoreScheduleConflicts: boolean = false,
  ccsOnlyEvent: boolean = false,
  leaveDates: LeaveDate[] = []
): StaffAvailability[] => {
  const eventDay = new Date(eventDate).getDay();
  const ccsSubjectCodes = ['BCA', 'CCC', 'CSC', 'ISY', 'ITE', 'ITN', 'ITD'];

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

    // Check schedule conflicts
    const conflicts = member.schedules.filter(schedule => {
      if (schedule.dayOfWeek !== eventDay) {
        return false;
      }

      // If it's a CCS-only event and this schedule is for a CCS subject, treat as available
      if (ccsOnlyEvent && schedule.subject && ccsSubjectCodes.includes(schedule.subject)) {
        return false; // No conflict because CCS classes are suspended
      }

      // Check time overlap
      const scheduleStart = schedule.startTime;
      const scheduleEnd = schedule.endTime;
      
      // Check if event time overlaps with schedule time
      return (
        (startTime >= scheduleStart && startTime < scheduleEnd) ||
        (endTime > scheduleStart && endTime <= scheduleEnd) ||
        (startTime <= scheduleStart && endTime >= scheduleEnd)
      );
    });

    if (conflicts.length === 0) {
      return {
        staff: member,
        isFullyAvailable: true
      };
    }

    // Staff has conflicts - calculate available time slots
    const conflictingTimeSlots = conflicts.map(conflict => ({
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      reason: conflict.subject ? `${conflict.subject} schedule` : "Schedule conflict"
    }));

    const availableTimeSlots = calculateAvailableTimeSlots(
      startTime,
      endTime,
      conflictingTimeSlots
    );

    return {
      staff: member,
      isFullyAvailable: false,
      availableTimeSlots,
      conflictingTimeSlots
    };
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
