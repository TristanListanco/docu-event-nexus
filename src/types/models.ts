
export type StaffRole = "Photographer" | "Videographer";

export interface Schedule {
  id: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  subject: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  photoUrl?: string;
  email?: string;
  schedules: Schedule[];
}

export type EventType = "General" | "SPECOM" | "LITCOM" | "CUACOM" | "SPODACOM";
export type EventStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
// Updated to match the database enums
export type AttendanceStatus = "Pending" | "Completed" | "Absent" | "Excused";

export interface StaffAssignment {
  staffId: string;
  attendanceStatus: AttendanceStatus;
}

export interface Event {
  id: string;
  logId: string;
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
  bigEventId?: string | null;
}
