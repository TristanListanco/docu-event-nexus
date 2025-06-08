
import { StaffMember } from "@/types/models";

export const getAvailableStaff = (
  staff: StaffMember[],
  eventDate: string,
  startTime: string,
  endTime: string,
  ignoreScheduleConflicts: boolean = false,
  ccsOnlyEvent: boolean = false
) => {
  if (!eventDate || !startTime || !endTime) {
    return { videographers: [], photographers: [] };
  }

  const eventDay = new Date(eventDate).getDay();
  const ccsSubjectCodes = ['BCA', 'CCC', 'CSC', 'ISY', 'ITE', 'ITN', 'ITD'];

  const availableStaff = staff.filter(member => {
    // Check if member is on leave
    const isOnLeave = member.leaveDates.some(leave => 
      eventDate >= leave.startDate && eventDate <= leave.endDate
    );
    
    if (isOnLeave) {
      return false;
    }

    // If ignoring schedule conflicts, return all non-leave staff
    if (ignoreScheduleConflicts) {
      return true;
    }

    // Check schedule conflicts
    const hasConflict = member.schedules.some(schedule => {
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

    return !hasConflict;
  });

  return {
    videographers: availableStaff.filter(member => 
      member.roles.includes("Videographer")
    ),
    photographers: availableStaff.filter(member => 
      member.roles.includes("Photographer")
    ),
  };
};
