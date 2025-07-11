export type StaffRole = "Photographer" | "Videographer" | "Working Com";
export type ConfirmationStatus = "pending" | "confirmed" | "declined";
export type StaffPosition = "Chairperson" | "Co-Chairperson" | "Secretary" | "Undersecretary" | "Associate";
export type StaffViewMode = "list" | "grid";

export interface Schedule {
  id: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  subjectScheduleId: string; // Reference to subject_schedules table
  subject?: string; // Subject code for CCS-only event logic
}

export interface SubjectSchedule {
  id: string;
  subject: string;
  schedules: Schedule[];
}

export interface LeaveDate {
  id: string;
  startDate: string; // "YYYY-MM-DD" format
  endDate: string; // "YYYY-MM-DD" format
}

export interface StaffMember {
  id: string;
  name: string;
  roles: StaffRole[]; // Changed from single role to array of roles
  photoUrl?: string;
  email?: string;
  schedules: Schedule[];
  subjectSchedules: SubjectSchedule[];
  leaveDates: LeaveDate[];
  position?: StaffPosition;
}

export type EventType = "General" | "SPECOM" | "LITCOM" | "CUACOM" | "SPODACOM";
export type EventStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
// Updated to match the database enums
export type AttendanceStatus = "Pending" | "Completed" | "Absent" | "Excused";

export interface StaffAssignment {
  staffId: string;
  attendanceStatus: AttendanceStatus;
  confirmationStatus?: ConfirmationStatus;
  confirmationToken?: string;
  confirmedAt?: string;
  declinedAt?: string;
}

export interface Event {
  id: string;
  logId: string;
  name: string;
  date: string;
  endDate?: string; // New field for multi-day events
  startTime: string;
  endTime: string;
  location: string;
  organizer?: string;
  type: EventType;
  status: EventStatus;
  videographers?: StaffAssignment[];
  photographers?: StaffAssignment[];
  ignoreScheduleConflicts: boolean;
  ccsOnlyEvent: boolean;
  isBigEvent: boolean;
  bigEventId?: string | null;
}

// New interface for staff availability with partial conflicts
export interface StaffAvailability {
  staff: StaffMember;
  isFullyAvailable: boolean;
  availableTimeSlots?: Array<{
    startTime: string;
    endTime: string;
  }>;
  conflictingTimeSlots?: Array<{
    startTime: string;
    endTime: string;
    reason: string;
  }>;
}
