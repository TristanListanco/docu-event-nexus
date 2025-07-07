
-- Add columns to track manual invitation sends and acceptance/decline timestamps
ALTER TABLE staff_assignments 
ADD COLUMN manual_invitation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_invitation_sent_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have a default timestamp for last_invitation_sent_at
-- if they have a confirmation_status (meaning an invitation was sent previously)
UPDATE staff_assignments 
SET last_invitation_sent_at = created_at 
WHERE confirmation_status IS NOT NULL AND last_invitation_sent_at IS NULL;
