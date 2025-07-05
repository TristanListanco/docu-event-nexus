import { StaffMember, StaffAvailability } from "@/types/models";
import { isWithinInterval, parseISO, format } from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
  reason?: string;
}

// Helper function to convert "HH:MM" to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes since midnight to "HH:MM"
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Check if two time ranges overlap
const timeRangesOverlap = (
  start1: string, end1: string,
  start2: string, end2: string
): boolean => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return start1Min < end2Min && end1Min > start2Min;
};

// Get available time slots after removing conflicts
const getAvailableTimeSlots = (
  eventStart: string,
  eventEnd: string,
  conflicts: Array<{ startTime: string; endTime: string; reason: string }>
): Array<{ startTime: string; endTime: string }> => {
  const eventStartMin = timeToMinutes(eventStart);
  const eventEndMin = timeToMinutes(eventEnd);
  
  // Sort conflicts by start time
  const sortedConflicts = conflicts
    .filter(conflict => timeRangesOverlap(eventStart, eventEnd, conflict.startTime, conflict.endTime))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    
  if (sortedConflicts.length === 0) {
    return [{ startTime: eventStart, endTime: eventEnd }];
  }
  
  const availableSlots: Array<{ startTime: string; endTime: string }> = [];
  let currentStart = eventStartMin;
  
  for (const conflict of sortedConflicts) {
    const conflictStartMin = Math.max(timeToMinutes(conflict.startTime), eventStartMin);
    const conflictEndMin = Math.min(timeToMinutes(conflict.endTime), eventEndMin);
    
    // Add slot before conflict if there's time
    if (currentStart < conflictStartMin) {
      availableSlots.push({
        startTime: minutesToTime(currentStart),
        endTime: minutesToTime(conflictStartMin)
      });
    }
    
    // Move current start to after this conflict
    currentStart = Math.max(currentStart, conflictEndMin);
  }
  
  // Add remaining time after last conflict
  if (currentStart < eventEndMin) {
    availableSlots.push({
      startTime: minutesToTime(currentStart),
      endTime: minutesToTime(eventEndMin)
    });
  }
  
  return availableSlots;
};

// Smart allocation function - prioritizes fully available staff
export const getSmartStaffAllocation = (
  staffAvailability: StaffAvailability[],
  eventStartTime: string,
  eventEndTime: string
): {
  recommendedStaff: string[];
  coverageGaps: Array<{ startTime: string; endTime: string }>;
  totalCoverage: number;
} => {
  const fullyAvailable = staffAvailability.filter(s => s.isFullyAvailable);
  
  // If we have fully available staff, recommend them first
  if (fullyAvailable.length > 0) {
    return {
      recommendedStaff: [fullyAvailable[0].staff.id],
      coverageGaps: [],
      totalCoverage: 100
    };
  }
  
  // Otherwise, try to create optimal coverage with partially available staff
  const partiallyAvailable = staffAvailability
    .filter(s => !s.isFullyAvailable && s.availableTimeSlots && s.availableTimeSlots.length > 0)
    .sort((a, b) => {
      // Sort by total available time (descending)
      const aTotalTime = a.availableTimeSlots?.reduce((sum, slot) => 
        sum + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)), 0) || 0;
      const bTotalTime = b.availableTimeSlots?.reduce((sum, slot) => 
        sum + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)), 0) || 0;
      return bTotalTime - aTotalTime;
    });
  
  const eventDuration = timeToMinutes(eventEndTime) - timeToMinutes(eventStartTime);
  let totalCoveredTime = 0;
  const recommendedStaff: string[] = [];
  const coveredSlots: Array<{ startTime: string; endTime: string }> = [];
  
  for (const staff of partiallyAvailable) {
    if (!staff.availableTimeSlots) continue;
    
    for (const slot of staff.availableTimeSlots) {
      // Check if this slot adds new coverage
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      
      let newCoverage = false;
      for (let minute = slotStart; minute < slotEnd; minute++) {
        const isAlreadyCovered = coveredSlots.some(covered => {
          const coveredStart = timeToMinutes(covered.startTime);
          const coveredEnd = timeToMinutes(covered.endTime);
          return minute >= coveredStart && minute < coveredEnd;
        });
        
        if (!isAlreadyCovered) {
          newCoverage = true;
          break;
        }
      }
      
      if (newCoverage && !recommendedStaff.includes(staff.staff.id)) {
        recommendedStaff.push(staff.staff.id);
        coveredSlots.push(slot);
        break;
      }
    }
  }
  
  // Calculate actual coverage
  const mergedSlots = mergeTimeSlots(coveredSlots);
  totalCoveredTime = mergedSlots.reduce((sum, slot) => 
    sum + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)), 0);
  
  // Find gaps
  const coverageGaps = findCoverageGaps(eventStartTime, eventEndTime, mergedSlots);
  
  return {
    recommendedStaff,
    coverageGaps,
    totalCoverage: Math.round((totalCoveredTime / eventDuration) * 100)
  };
};

// Helper function to merge overlapping time slots
const mergeTimeSlots = (slots: Array<{ startTime: string; endTime: string }>): Array<{ startTime: string; endTime: string }> => {
  if (slots.length === 0) return [];
  
  const sorted = slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const merged: Array<{ startTime: string; endTime: string }> = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    if (timeToMinutes(current.startTime) <= timeToMinutes(last.endTime)) {
      // Overlapping, merge them
      last.endTime = timeToMinutes(current.endTime) > timeToMinutes(last.endTime) 
        ? current.endTime 
        : last.endTime;
    } else {
      // No overlap, add as new slot
      merged.push(current);
    }
  }
  
  return merged;
};

// Helper function to find coverage gaps
const findCoverageGaps = (
  eventStart: string,
  eventEnd: string,
  coveredSlots: Array<{ startTime: string; endTime: string }>
): Array<{ startTime: string; endTime: string }> => {
  if (coveredSlots.length === 0) {
    return [{ startTime: eventStart, endTime: eventEnd }];
  }
  
  const gaps: Array<{ startTime: string; endTime: string }> = [];
  const eventStartMin = timeToMinutes(eventStart);
  const eventEndMin = timeToMinutes(eventEnd);
  
  let currentTime = eventStartMin;
  
  for (const slot of coveredSlots) {
    const slotStart = timeToMinutes(slot.startTime);
    
    if (currentTime < slotStart) {
      gaps.push({
        startTime: minutesToTime(currentTime),
        endTime: slot.startTime
      });
    }
    
    currentTime = Math.max(currentTime, timeToMinutes(slot.endTime));
  }
  
  // Check for gap after last covered slot
  if (currentTime < eventEndMin) {
    gaps.push({
      startTime: minutesToTime(currentTime),
      endTime: eventEnd
    });
  }
  
  return gaps;
};

export const getEnhancedStaffAvailability = (
  staff: StaffMember[],
  eventDate: string,
  eventStartTime: string,
  eventEndTime: string,
  ignoreScheduleConflicts: boolean = false,
  ccsOnlyEvent: boolean = false
): StaffAvailability[] => {
  const eventDateObj = parseISO(eventDate);
  const dayOfWeek = eventDateObj.getDay();
  
  return staff.map(staffMember => {
    if (ignoreScheduleConflicts) {
      return {
        staff: staffMember,
        isFullyAvailable: true,
        availableTimeSlots: [{ startTime: eventStartTime, endTime: eventEndTime }],
        conflictingTimeSlots: []
      };
    }
    
    const conflicts: Array<{ startTime: string; endTime: string; reason: string }> = [];
    
    // Check leave dates
    const isOnLeave = staffMember.leaveDates.some(leave => 
      isWithinInterval(eventDateObj, {
        start: parseISO(leave.startDate),
        end: parseISO(leave.endDate)
      })
    );
    
    if (isOnLeave) {
      return {
        staff: staffMember,
        isFullyAvailable: false,
        availableTimeSlots: [],
        conflictingTimeSlots: [{ 
          startTime: eventStartTime, 
          endTime: eventEndTime,
          reason: "On leave"
        }]
      };
    }
    
    // Check regular schedules
    const daySchedules = staffMember.schedules.filter(schedule => 
      schedule.dayOfWeek === dayOfWeek && !schedule.subjectScheduleId
    );
    
    daySchedules.forEach(schedule => {
      if (timeRangesOverlap(eventStartTime, eventEndTime, schedule.startTime, schedule.endTime)) {
        conflicts.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          reason: "Regular schedule"
        });
      }
    });
    
    // Check subject schedules (unless it's a CCS-only event)
    if (!ccsOnlyEvent) {
      const subjectSchedules = staffMember.schedules.filter(schedule => 
        schedule.dayOfWeek === dayOfWeek && schedule.subjectScheduleId
      );
      
      subjectSchedules.forEach(schedule => {
        if (timeRangesOverlap(eventStartTime, eventEndTime, schedule.startTime, schedule.endTime)) {
          conflicts.push({
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            reason: `${schedule.subject || 'Class'} schedule`
          });
        }
      });
    }
    
    // Calculate available time slots
    const availableSlots = getAvailableTimeSlots(eventStartTime, eventEndTime, conflicts);
    const isFullyAvailable = conflicts.length === 0;
    
    return {
      staff: staffMember,
      isFullyAvailable,
      availableTimeSlots: availableSlots,
      conflictingTimeSlots: conflicts.filter(conflict => 
        timeRangesOverlap(eventStartTime, eventEndTime, conflict.startTime, conflict.endTime)
      )
    };
  });
};
