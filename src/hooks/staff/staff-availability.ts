
import { StaffMember, StaffAvailability } from "@/types/models";

export const isStaffAvailable = (
  member: StaffMember,
  eventDate: string,
  startTime: string,
  endTime: string,
  ccsOnlyEvent: boolean = false
): StaffAvailability => {
  const eventDay = new Date(eventDate).getDay();
  const ccsSubjectCodes = ['BCA', 'CCC', 'CSC', 'ISY', 'ITE', 'ITN', 'ITD'];

  // Check if member is on leave for the event date
  const isOnLeave = member.leaveDates.some(leave => 
    eventDate >= leave.startDate && eventDate <= leave.endDate
  );
  
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

  // Check schedule conflicts using the new structure
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

  return {
    staff: member,
    isFullyAvailable: false,
    conflictingTimeSlots: conflicts.map(conflict => ({
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      reason: "Schedule conflict"
    }))
  };
};

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
    // Check if member is on leave for the event date
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

    // Check schedule conflicts using the new structure
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

// Helper function to check if a staff member is currently on leave
export const isStaffOnLeaveToday = (staffMember: StaffMember): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return staffMember.leaveDates.some(leave => 
    today >= leave.startDate && today <= leave.endDate
  );
};
