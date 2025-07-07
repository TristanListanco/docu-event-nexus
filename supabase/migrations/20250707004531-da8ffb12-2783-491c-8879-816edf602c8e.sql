
-- Add the missing invitation timestamp columns to staff_assignments table
ALTER TABLE public.staff_assignments 
ADD COLUMN manual_invitation_sent_at timestamp with time zone,
ADD COLUMN last_invitation_sent_at timestamp with time zone;
