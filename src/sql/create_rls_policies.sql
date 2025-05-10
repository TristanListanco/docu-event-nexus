
-- Enable Row Level Security on tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY events_user_policy ON public.events 
  FOR ALL 
  USING (user_id = auth.uid());

-- Create policies for staff_members table
CREATE POLICY staff_members_user_policy ON public.staff_members 
  FOR ALL 
  USING (user_id = auth.uid());

-- Create policies for schedules table
CREATE POLICY schedules_user_policy ON public.schedules 
  FOR ALL 
  USING (user_id = auth.uid());

-- Create policies for staff_assignments table
CREATE POLICY staff_assignments_user_policy ON public.staff_assignments 
  FOR ALL 
  USING (user_id = auth.uid());
