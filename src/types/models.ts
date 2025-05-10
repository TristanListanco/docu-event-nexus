
// Staff member types
export type StaffRole = "Videographer" | "Photographer";
export type AttendanceStatus = "Pending" | "Completed" | "Absent" | "Excused";

export interface Schedule {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  subject: string; // e.g., "MAT051"
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  photoUrl?: string;
  email?: string;
  schedules: Schedule[];
  statistics?: {
    completed: number;
    absent: number;
    excused: number;
  };
}

// Event types
export type EventType = "SPECOM" | "LITCOM" | "CUACOM" | "SPODACOM" | "General";
export type EventStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";

export interface StaffAssignment {
  staffId: string;
  attendanceStatus?: AttendanceStatus;
}

export interface Event {
  id: string;
  logId: string; // Unique Event Log ID
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: EventType;
  status: EventStatus;
  videographers: StaffAssignment[];
  photographers: StaffAssignment[];
  ignoreScheduleConflicts: boolean;
  isBigEvent: boolean;
  bigEventId?: string; // Reference to the parent big event if part of one
}

export interface BigEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  events: string[]; // Array of event IDs
}
