
export interface NotificationRequest {
  eventId: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer?: string;
  type: string;
  assignedStaff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  isUpdate?: boolean;
  changes?: {
    name?: { old: string; new: string };
    date?: { old: string; new: string };
    startTime?: { old: string; new: string };
    endTime?: { old: string; new: string };
    location?: { old: string; new: string };
    organizer?: { old: string; new: string };
    type?: { old: string; new: string };
  };
  downloadOnly?: boolean;
}

export interface StaffWithToken {
  id: string;
  name: string;
  email: string;
  role: string;
  confirmationToken: string | null;
}
