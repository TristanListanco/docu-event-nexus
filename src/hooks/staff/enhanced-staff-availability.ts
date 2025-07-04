
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
  conflicts: TimeSlot[]
): TimeSlot[] => {
  const eventStartMin = timeToMinutes(eventStart);
  const eventEndMin = timeToMinutes(eventEnd);
  
  // Sort conflicts by start time
  const sortedConflicts = conflicts
    .filter(conflict => timeRangesOverlap(eventStart, eventEnd, conflict.startTime, conflict.endTime))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    
  if (sortedConflicts.length === 0) {
    return [{ startTime: eventStart, endTime: eventEnd }];
  }
  
  const availableSlots: TimeSlot[] = [];
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
    
    const conflicts: TimeSlot[] = [];
    
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
