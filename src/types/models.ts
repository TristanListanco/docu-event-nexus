
export type StaffRole = "Photographer" | "Videographer";

export interface Schedule {
  id: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  subject: string;
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
  leaveDates: LeaveDate[];
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
