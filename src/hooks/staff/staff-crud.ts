
import { supabase } from "@/integrations/supabase/client";
import { StaffMember, StaffRole, LeaveDate, SubjectSchedule, Schedule } from "@/types/models";
import { toast } from "@/hooks/use-toast";

export const loadStaffFromDatabase = async (userId: string): Promise<StaffMember[]> => {
  // Load staff members with all related data
  const { data: staffData, error: staffError } = await supabase
    .from("staff_members")
    .select("*")
    .eq("user_id", userId);

  if (staffError) {
    throw staffError;
  }

  // Load all staff roles
  const { data: rolesData, error: rolesError } = await supabase
    .from("staff_roles")
    .select("*")
    .eq("user_id", userId);

  if (rolesError) {
    throw rolesError;
  }

  // Load all leave dates
  const { data: leaveDatesData, error: leaveDatesError } = await supabase
    .from("leave_dates")
    .select("*")
    .eq("user_id", userId);

  if (leaveDatesError) {
    throw leaveDatesError;
  }

  // Load all subject schedules
  const { data: subjectSchedulesData, error: subjectSchedulesError } = await supabase
    .from("subject_schedules")
    .select("*")
    .eq("user_id", userId);

  if (subjectSchedulesError) {
    throw subjectSchedulesError;
  }

  // Load all schedules
  const { data: schedulesData, error: schedulesError } = await supabase
    .from("schedules")
    .select("*")
    .eq("user_id", userId);

  if (schedulesError) {
    throw schedulesError;
  }

  // Group data by staff member
  const staffMembers: StaffMember[] = staffData.map((staff) => {
    // Get roles for this staff member
    const staffRoles = rolesData
      .filter(role => role.staff_id === staff.id)
      .map(role => role.role as StaffRole);

    // Get leave dates for this staff member
    const staffLeaveDates: LeaveDate[] = leaveDatesData
      .filter(leave => leave.staff_id === staff.id)
      .map(leave => ({
        id: leave.id,
        startDate: leave.start_date,
        endDate: leave.end_date
      }));

    // Get subject schedules for this staff member
    const staffSubjectSchedules: SubjectSchedule[] = subjectSchedulesData
      .filter(subjectSchedule => subjectSchedule.staff_id === staff.id)
      .map(subjectSchedule => {
        // Get schedules for this subject schedule
        const subjectScheduleSchedules: Schedule[] = schedulesData
          .filter(schedule => schedule.subject_schedule_id === subjectSchedule.id)
          .map(schedule => ({
            id: schedule.id,
            dayOfWeek: schedule.day_of_week,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            subjectScheduleId: schedule.subject_schedule_id || "",
            subject: subjectSchedule.subject
          }));

        return {
          id: subjectSchedule.id,
          subject: subjectSchedule.subject,
          schedules: subjectScheduleSchedules
        };
      });

    // Get all schedules for this staff member (including those not part of subject schedules)
    const allStaffSchedules: Schedule[] = schedulesData
      .filter(schedule => schedule.staff_id === staff.id)
      .map(schedule => ({
        id: schedule.id,
        dayOfWeek: schedule.day_of_week,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        subjectScheduleId: schedule.subject_schedule_id || "",
        subject: schedule.subject_schedule_id ? 
          subjectSchedulesData.find(ss => ss.id === schedule.subject_schedule_id)?.subject : 
          undefined
      }));

    return {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      roles: staffRoles.length > 0 ? staffRoles : [staff.role as StaffRole], // Fallback to old single role
      schedules: allStaffSchedules,
      subjectSchedules: staffSubjectSchedules,
      leaveDates: staffLeaveDates,
      position: staff.position,
    };
  });

  return staffMembers;
};

export const addStaffToDatabase = async (
  userId: string,
  staffData: Omit<StaffMember, "id">
) => {
  // Insert staff member
  const { data: staff, error: staffError } = await supabase
    .from("staff_members")
    .insert({
      name: staffData.name,
      email: staffData.email,
      role: staffData.roles[0], // Use first role as primary role
      position: staffData.position,
      user_id: userId,
    })
    .select()
    .single();

  if (staffError) {
    throw staffError;
  }

  // Insert all roles
  if (staffData.roles.length > 0) {
    const rolesInserts = staffData.roles.map(role => ({
      staff_id: staff.id,
      role: role,
      user_id: userId
    }));

    const { error: rolesError } = await supabase
      .from("staff_roles")
      .insert(rolesInserts);

    if (rolesError) {
      console.error("Error inserting roles:", rolesError);
    }
  }

  // Insert subject schedules and their schedules
  if (staffData.subjectSchedules.length > 0) {
    for (const subjectSchedule of staffData.subjectSchedules) {
      const { data: insertedSubjectSchedule, error: subjectScheduleError } = await supabase
        .from("subject_schedules")
        .insert({
          staff_id: staff.id,
          subject: subjectSchedule.subject,
          user_id: userId
        })
        .select()
        .single();

      if (subjectScheduleError) {
        console.error("Error inserting subject schedule:", subjectScheduleError);
        continue;
      }

      // Insert schedules for this subject
      if (subjectSchedule.schedules.length > 0) {
        const schedulesInserts = subjectSchedule.schedules.map(schedule => ({
          staff_id: staff.id,
          subject_schedule_id: insertedSubjectSchedule.id,
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          user_id: userId
        }));

        const { error: schedulesError } = await supabase
          .from("schedules")
          .insert(schedulesInserts);

        if (schedulesError) {
          console.error("Error inserting schedules:", schedulesError);
        }
      }
    }
  }

  // Insert leave dates
  if (staffData.leaveDates.length > 0) {
    const leaveDatesInserts = staffData.leaveDates.map(leave => ({
      staff_id: staff.id,
      start_date: leave.startDate,
      end_date: leave.endDate,
      user_id: userId
    }));

    const { error: leaveDatesError } = await supabase
      .from("leave_dates")
      .insert(leaveDatesInserts);

    if (leaveDatesError) {
      console.error("Error inserting leave dates:", leaveDatesError);
    }
  }

  toast({
    title: "Staff Added",
    description: `${staffData.name} has been added successfully.`,
  });

  return staff;
};

export const updateStaffInDatabase = async (
  userId: string,
  staffId: string,
  staffData: Partial<Omit<StaffMember, "id">>
) => {
  // Update staff member basic info
  const { data: staff, error: staffError } = await supabase
    .from("staff_members")
    .update({
      name: staffData.name,
      email: staffData.email,
      role: staffData.roles?.[0], // Update primary role
      position: staffData.position,
    })
    .eq("id", staffId)
    .eq("user_id", userId)
    .select()
    .single();

  if (staffError) {
    throw staffError;
  }

  // Update roles if provided
  if (staffData.roles) {
    // Delete existing roles
    await supabase
      .from("staff_roles")
      .delete()
      .eq("staff_id", staffId)
      .eq("user_id", userId);

    // Insert new roles
    if (staffData.roles.length > 0) {
      const rolesInserts = staffData.roles.map(role => ({
        staff_id: staffId,
        role: role,
        user_id: userId
      }));

      const { error: rolesError } = await supabase
        .from("staff_roles")
        .insert(rolesInserts);

      if (rolesError) {
        console.error("Error updating roles:", rolesError);
      }
    }
  }

  // Update subject schedules if provided
  if (staffData.subjectSchedules) {
    // Delete existing subject schedules and their schedules
    const { data: existingSubjectSchedules } = await supabase
      .from("subject_schedules")
      .select("id")
      .eq("staff_id", staffId)
      .eq("user_id", userId);

    if (existingSubjectSchedules) {
      for (const existingSubjectSchedule of existingSubjectSchedules) {
        // Delete schedules for this subject schedule
        await supabase
          .from("schedules")
          .delete()
          .eq("subject_schedule_id", existingSubjectSchedule.id)
          .eq("user_id", userId);
      }
    }

    // Delete subject schedules
    await supabase
      .from("subject_schedules")
      .delete()
      .eq("staff_id", staffId)
      .eq("user_id", userId);

    // Insert new subject schedules
    for (const subjectSchedule of staffData.subjectSchedules) {
      const { data: insertedSubjectSchedule, error: subjectScheduleError } = await supabase
        .from("subject_schedules")
        .insert({
          staff_id: staffId,
          subject: subjectSchedule.subject,
          user_id: userId
        })
        .select()
        .single();

      if (subjectScheduleError) {
        console.error("Error updating subject schedule:", subjectScheduleError);
        continue;
      }

      // Insert schedules for this subject
      if (subjectSchedule.schedules.length > 0) {
        const schedulesInserts = subjectSchedule.schedules.map(schedule => ({
          staff_id: staffId,
          subject_schedule_id: insertedSubjectSchedule.id,
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          user_id: userId
        }));

        const { error: schedulesError } = await supabase
          .from("schedules")
          .insert(schedulesInserts);

        if (schedulesError) {
          console.error("Error updating schedules:", schedulesError);
        }
      }
    }
  }

  // Update leave dates if provided
  if (staffData.leaveDates) {
    // Delete existing leave dates
    await supabase
      .from("leave_dates")
      .delete()
      .eq("staff_id", staffId)
      .eq("user_id", userId);

    // Insert new leave dates
    if (staffData.leaveDates.length > 0) {
      const leaveDatesInserts = staffData.leaveDates.map(leave => ({
        staff_id: staffId,
        start_date: leave.startDate,
        end_date: leave.endDate,
        user_id: userId
      }));

      const { error: leaveDatesError } = await supabase
        .from("leave_dates")
        .insert(leaveDatesInserts);

      if (leaveDatesError) {
        console.error("Error updating leave dates:", leaveDatesError);
      }
    }
  }

  toast({
    title: "Staff Updated",
    description: `${staffData.name} has been updated successfully.`,
  });

  return staff;
};

export const deleteStaffFromDatabase = async (
  userId: string,
  staffId: string
) => {
  // Delete all related data first
  
  // Delete leave dates
  await supabase
    .from("leave_dates")
    .delete()
    .eq("staff_id", staffId)
    .eq("user_id", userId);

  // Delete schedules (both standalone and subject-related)
  await supabase
    .from("schedules")
    .delete()
    .eq("staff_id", staffId)
    .eq("user_id", userId);

  // Delete subject schedules
  await supabase
    .from("subject_schedules")
    .delete()
    .eq("staff_id", staffId)
    .eq("user_id", userId);

  // Delete staff roles
  await supabase
    .from("staff_roles")
    .delete()
    .eq("staff_id", staffId)
    .eq("user_id", userId);

  // Delete staff assignments
  await supabase
    .from("staff_assignments")
    .delete()
    .eq("staff_id", staffId)
    .eq("user_id", userId);

  // Finally delete the staff member
  const { error } = await supabase
    .from("staff_members")
    .delete()
    .eq("id", staffId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  toast({
    title: "Staff Deleted",
    description: "The staff member has been successfully deleted.",
  });

  return true;
};
