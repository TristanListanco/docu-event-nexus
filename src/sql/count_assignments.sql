
-- Create a function to count staff assignments with each status
CREATE OR REPLACE FUNCTION public.count_staff_assignments(staff_id_param UUID)
RETURNS TABLE(completed BIGINT, absent BIGINT, excused BIGINT) 
LANGUAGE SQL
AS $$
  SELECT
    COUNT(*) FILTER (WHERE attendance_status = 'Completed') as completed,
    COUNT(*) FILTER (WHERE attendance_status = 'Absent') as absent,
    COUNT(*) FILTER (WHERE attendance_status = 'Excused') as excused
  FROM
    public.staff_assignments
  WHERE
    staff_id = staff_id_param;
$$;
