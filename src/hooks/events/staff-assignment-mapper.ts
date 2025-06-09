
import { supabase } from "@/integrations/supabase/client";
import { AttendanceStatus, ConfirmationStatus } from "@/types/models";

export interface StaffAssignmentData {
  staff_id: string;
  attendance_status: AttendanceStatus;
  confirmation_status: ConfirmationStatus;
  confirmation_token: string;
  confirmed_at: string;
  declined_at: string;
  staff_members: {
    id: string;
    name: string;
  };
}

export const fetchStaffAssignmentsWithRoles = async (eventId: string) => {
  // Query for all staff assignments for this event with staff member details and confirmation status
  const { data: allAssignments, error: assignmentsError } = await supabase
    .from("staff_assignments")
    .select(`
      staff_id, 
      attendance_status,
      confirmation_status,
      confirmation_token,
      confirmed_at,
      declined_at,
      staff_members!inner(id, name)
    `)
    .eq("event_id", eventId);

  if (assignmentsError) {
    console.error("Error fetching staff assignments:", assignmentsError);
    throw assignmentsError;
  }

  // Get staff roles for all assigned staff
  const assignedStaffIds = allAssignments?.map(a => a.staff_members.id) || [];
  let staffRolesMap: Record<string, string[]> = {};
  
  if (assignedStaffIds.length > 0) {
    const { data: staffRoles, error: rolesError } = await supabase
      .from("staff_roles")
      .select("staff_id, role")
      .in("staff_id", assignedStaffIds);

    if (rolesError) {
      console.error("Error fetching staff roles:", rolesError);
      throw rolesError;
    } else {
      // Group roles by staff_id
      staffRolesMap = staffRoles?.reduce((acc, role) => {
        if (!acc[role.staff_id]) {
          acc[role.staff_id] = [];
        }
        acc[role.staff_id].push(role.role);
        return acc;
      }, {} as Record<string, string[]>) || {};
    }
  }

  // Filter assignments by checking if staff member has the required role
  const videographerAssignments = allAssignments?.filter(a => {
    const staffRoles = staffRolesMap[a.staff_members.id] || [];
    return staffRoles.includes("Videographer");
  }) || [];
  
  const photographerAssignments = allAssignments?.filter(a => {
    const staffRoles = staffRolesMap[a.staff_members.id] || [];
    return staffRoles.includes("Photographer");
  }) || [];

  return {
    videographerAssignments: videographerAssignments.map(v => ({ 
      staffId: v.staff_id,
      attendanceStatus: v.attendance_status as AttendanceStatus,
      confirmationStatus: v.confirmation_status as ConfirmationStatus,
      confirmationToken: v.confirmation_token,
      confirmedAt: v.confirmed_at,
      declinedAt: v.declined_at
    })),
    photographerAssignments: photographerAssignments.map(p => ({ 
      staffId: p.staff_id,
      attendanceStatus: p.attendance_status as AttendanceStatus,
      confirmationStatus: p.confirmation_status as ConfirmationStatus,
      confirmationToken: p.confirmation_token,
      confirmedAt: p.confirmed_at,
      declinedAt: p.declined_at
    }))
  };
};
