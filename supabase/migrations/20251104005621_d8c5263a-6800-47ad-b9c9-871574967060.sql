-- Add excuse_reason column to staff_assignments table
ALTER TABLE public.staff_assignments 
ADD COLUMN IF NOT EXISTS excuse_reason TEXT;