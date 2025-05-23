export type StaffRole = "Photographer" | "Videographer";

export interface Schedule {
  id: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  subject: string;
}

// Add email to StaffMember type if not already present
export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  photoUrl?: string;
  email?: string;
  schedules: Schedule[];
}
