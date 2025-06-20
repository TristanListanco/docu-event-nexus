-- Enable Row Level Security on tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS events_user_policy ON public.events;
DROP POLICY IF EXISTS staff_members_user_policy ON public.staff_members;
DROP POLICY IF EXISTS schedules_user_policy ON public.schedules;
DROP POLICY IF EXISTS staff_assignments_user_policy ON public.staff_assignments;

-- Create more granular policies for events table
CREATE POLICY events_select_policy ON public.events
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.staff_assignments
      WHERE staff_assignments.event_id = events.id
      AND staff_assignments.user_id = auth.uid()
    )
  );

CREATE POLICY events_insert_policy ON public.events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY events_update_policy ON public.events
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY events_delete_policy ON public.events
  FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for staff_members table
CREATE POLICY staff_members_select_policy ON public.staff_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.staff_assignments
        WHERE staff_assignments.event_id = events.id
        AND staff_assignments.staff_id = staff_members.id
      )
    )
  );

CREATE POLICY staff_members_insert_policy ON public.staff_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY staff_members_update_policy ON public.staff_members
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY staff_members_delete_policy ON public.staff_members
  FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for schedules table
CREATE POLICY schedules_select_policy ON public.schedules
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY schedules_insert_policy ON public.schedules
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY schedules_update_policy ON public.schedules
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY schedules_delete_policy ON public.schedules
  FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for staff_assignments table
CREATE POLICY staff_assignments_select_policy ON public.staff_assignments
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = staff_assignments.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY staff_assignments_insert_policy ON public.staff_assignments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = staff_assignments.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY staff_assignments_update_policy ON public.staff_assignments
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = staff_assignments.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY staff_assignments_delete_policy ON public.staff_assignments
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = staff_assignments.event_id
      AND events.user_id = auth.uid()
    )
  ); 