
export interface AssignmentData {
  id: string;
  confirmation_status: string | null;
  confirmation_token_expires_at: string | null;
  confirmed_at: string | null;
  declined_at: string | null;
  user_id: string;
  staff_id: string;
  event_id: string;
  events: {
    name: string;
    date: string;
    start_time: string;
    end_time?: string;
    location: string;
    status: string;
  };
  staff_members: {
    name: string;
    email: string;
  };
}

export interface RequestParams {
  token: string | null;
  action: string | null;
  isDirectCall: boolean;
}
