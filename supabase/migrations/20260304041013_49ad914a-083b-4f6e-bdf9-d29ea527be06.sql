
-- Create semester enum
CREATE TYPE public.semester_type AS ENUM ('1st Semester', '2nd Semester', 'Summer');

-- Create terms table
CREATE TABLE public.terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_year TEXT NOT NULL, -- e.g. "2025-2026"
  semester semester_type NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own terms" ON public.terms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own terms" ON public.terms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own terms" ON public.terms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own terms" ON public.terms FOR DELETE USING (auth.uid() = user_id);

-- Add term_id to events table
ALTER TABLE public.events ADD COLUMN term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE;

-- Add term_id to staff_members table
ALTER TABLE public.staff_members ADD COLUMN term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE;

-- Add term_id to staff_roles table
ALTER TABLE public.staff_roles ADD COLUMN term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE;

-- Add term_id to schedules table
ALTER TABLE public.schedules ADD COLUMN term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE;

-- Add term_id to subject_schedules table
ALTER TABLE public.subject_schedules ADD COLUMN term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE;

-- Add term_id to leave_dates table
ALTER TABLE public.leave_dates ADD COLUMN term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE;

-- Add term_id to notifications table
ALTER TABLE public.notifications ADD COLUMN term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_events_term_id ON public.events(term_id);
CREATE INDEX idx_staff_members_term_id ON public.staff_members(term_id);
CREATE INDEX idx_terms_user_id ON public.terms(user_id);
CREATE INDEX idx_terms_is_archived ON public.terms(is_archived);
