import { StaffAvailability } from "@/types/models";
import { SmartAllocationResult } from "./types";

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getCoverageColor = (coverage: number): string => {
  if (coverage >= 90) return "text-green-600 dark:text-green-400";
  if (coverage >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

export const formatTimeSlots = (timeSlots: Array<{startTime: string; endTime: string}>): string => {
  return timeSlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(", ");
};

export const getConflictReason = (availability: StaffAvailability): string => {
  if (availability.conflictingTimeSlots && availability.conflictingTimeSlots.length > 0) {
    return availability.conflictingTimeSlots[0].reason;
  }
  return "Schedule conflict";
};

export const getDetailedConflictReasons = (availability: StaffAvailability): string => {
  if (!availability.conflictingTimeSlots || availability.conflictingTimeSlots.length === 0) {
    return "No conflicts";
  }

  // Get unique subject names from conflicts
  const uniqueSubjects = new Set<string>();

  availability.conflictingTimeSlots.forEach(conflict => {
    uniqueSubjects.add(conflict.reason);
  });

  // Return just the subject names separated by commas
  return Array.from(uniqueSubjects).sort().join(', ');
};

export const getEnhancedSmartAllocation = (
  selectedStaffIds: string[],
  roleStaff: StaffAvailability[],
  eventStartTime?: string,
  eventEndTime?: string
): SmartAllocationResult | null => {
  if (!eventStartTime || !eventEndTime || selectedStaffIds.length === 0) return null;
  
  const eventStart = timeToMinutes(eventStartTime);
  const eventEnd = timeToMinutes(eventEndTime);
  const eventDuration = eventEnd - eventStart;
  
  // Get all selected staff availability
  const selectedStaffAvailability = roleStaff.filter(s => selectedStaffIds.includes(s.staff.id));
  
  // Create coverage map
  const coverageMap: boolean[] = new Array(eventDuration).fill(false);
  
  selectedStaffAvailability.forEach(availability => {
    if (availability.isFullyAvailable) {
      // Full coverage
      coverageMap.fill(true);
    } else if (availability.availableTimeSlots) {
      availability.availableTimeSlots.forEach(slot => {
        const slotStart = Math.max(0, timeToMinutes(slot.startTime) - eventStart);
        const slotEnd = Math.min(eventDuration, timeToMinutes(slot.endTime) - eventStart);
        
        for (let i = slotStart; i < slotEnd; i++) {
          coverageMap[i] = true;
        }
      });
    }
  });
  
  const coveredMinutes = coverageMap.filter(Boolean).length;
  const coveragePercentage = Math.round((coveredMinutes / eventDuration) * 100);
  
  // Find gaps
  const gaps: Array<{start: string; end: string}> = [];
  let gapStart = -1;
  
  for (let i = 0; i < coverageMap.length; i++) {
    if (!coverageMap[i] && gapStart === -1) {
      gapStart = i;
    } else if (coverageMap[i] && gapStart !== -1) {
      gaps.push({
        start: minutesToTime(eventStart + gapStart),
        end: minutesToTime(eventStart + i)
      });
      gapStart = -1;
    }
  }
  
  // Handle gap at the end
  if (gapStart !== -1) {
    gaps.push({
      start: minutesToTime(eventStart + gapStart),
      end: eventEndTime
    });
  }
  
  return { coveragePercentage, gaps };
};
