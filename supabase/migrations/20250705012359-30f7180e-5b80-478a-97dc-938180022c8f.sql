
-- Add position column to staff_members table
ALTER TABLE public.staff_members 
ADD COLUMN position TEXT;

-- Create an enum for positions (optional but recommended for data consistency)
CREATE TYPE public.staff_position AS ENUM (
  'Chairperson', 
  'Co-Chairperson', 
  'Secretary', 
  'Undersecretary', 
  'Associate'
);

-- Update the position column to use the enum type
ALTER TABLE public.staff_members 
ALTER COLUMN position TYPE staff_position USING position::staff_position;
