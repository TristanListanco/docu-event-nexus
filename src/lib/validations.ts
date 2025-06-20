import { z } from "zod";

// Email validation schema
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required");

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number");

// User registration schema
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: emailSchema,
  password: passwordSchema,
});

// User login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Event creation/update schema
export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(200, "Event name must be less than 200 characters"),
  logId: z.string().min(1, "Log ID is required").max(50, "Log ID must be less than 50 characters"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format"),
  location: z.string().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
  organizer: z.string().optional(),
  type: z.enum(["General", "Academic", "Social", "Sports", "Cultural", "Other"]),
  ignoreScheduleConflicts: z.boolean().default(false),
  ccsOnlyEvent: z.boolean().default(false),
  isBigEvent: z.boolean().default(false),
  bigEventId: z.string().nullable().default(null),
}).refine((data) => {
  const startTime = new Date(`2000-01-01T${data.startTime}`);
  const endTime = new Date(`2000-01-01T${data.endTime}`);
  return endTime > startTime;
}, {
  message: "End time must be later than start time",
  path: ["endTime"],
});

// Staff member schema
export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: emailSchema.optional().or(z.literal("")),
  roles: z.array(z.enum(["Photographer", "Videographer", "Working Com"])).min(1, "At least one role must be selected"),
  schedules: z.array(z.any()).default([]),
  subjectSchedules: z.array(z.any()).default([]),
  leaveDates: z.array(z.any()).default([]),
});

// Staff assignment schema
export const staffAssignmentSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  staffId: z.string().uuid("Invalid staff ID"),
  role: z.enum(["Photographer", "Videographer", "Working Com"]),
});

// Confirmation request schema (for Edge Functions)
export const confirmationRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
  action: z.enum(["confirm", "decline", "check"]),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

// Email request schema (for Edge Functions)
export const emailRequestSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  staffId: z.string().uuid("Invalid staff ID"),
  staffName: z.string().min(1, "Staff name is required"),
  staffEmail: emailSchema,
  staffRole: z.string().min(1, "Staff role is required"),
  eventName: z.string().min(1, "Event name is required"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format"),
  location: z.string().min(1, "Location is required"),
  organizer: z.string().optional(),
  type: z.string().min(1, "Type is required"),
});

// Type exports for TypeScript
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type StaffFormData = z.infer<typeof staffSchema>;
export type StaffAssignmentFormData = z.infer<typeof staffAssignmentSchema>;
export type ConfirmationRequestData = z.infer<typeof confirmationRequestSchema>;
export type EmailRequestData = z.infer<typeof emailRequestSchema>; 