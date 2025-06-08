import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { StaffMember, Schedule, StaffRole, LeaveDate, SubjectSchedule } from "@/types/models";
import { toast } from "./use-toast";
import { isWithinInterval, parseISO, isBefore, isAfter, getDay } from "date-fns";

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadStaff = async () => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetch all staff members
      const { data: staffData, error: staffError } = await supabase
        .from("staff_members")
        .select("*")
        .eq("user_id", user.id);

      if (staffError) {
        throw staffError;
      }

      console.log("Staff data from database:", staffData);

      // Fetch staff roles, schedules, subject schedules and leave dates for each staff member
      const staffMembers: StaffMember[] = await Promise.all(
        staffData.map(async (member) => {
          // Fetch roles for this staff member
          const { data: rolesData, error: rolesError } = await supabase
            .from("staff_roles")
            .select("role")
            .eq("staff_id", member.id);

          if (rolesError) {
            console.error("Error loading staff roles:", rolesError.message);
          }

          // Fetch subject schedules
          const { data: subjectSchedulesData, error: subjectSchedulesError } = await supabase
            .from("subject_schedules")
            .select("*")
            .eq("staff_id", member.id);

          if (subjectSchedulesError) {
            console.error("Error loading subject schedules:", subjectSchedulesError.message);
          }

          // Fetch schedules with subject schedule references
          const { data: schedulesData, error: schedulesError } = await supabase
            .from("schedules")
            .select("*")
            .eq("staff_id", member.id);

          if (schedulesError) {
            console.error("Error loading schedules:", schedulesError.message);
          }

          const { data: leaveDatesData, error: leaveDatesError } = await (supabase as any)
            .from("leave_dates")
            .select("*")
            .eq("staff_id", member.id);

          if (leaveDatesError) {
            console.error("Error loading leave dates:", leaveDatesError.message);
          }

          // Group schedules by subject schedule
          const subjectSchedules: SubjectSchedule[] = (subjectSchedulesData || []).map(ss => ({
            id: ss.id,
            subject: ss.subject,
            schedules: (schedulesData || [])
              .filter(schedule => schedule.subject_schedule_id === ss.id)
              .map(schedule => ({
                id: schedule.id,
                dayOfWeek: schedule.day_of_week,
                startTime: schedule.start_time,
                endTime: schedule.end_time,
                subjectScheduleId: schedule.subject_schedule_id
              }))
          }));

          // Legacy schedules (without subject_schedule_id) for backward compatibility
          const legacySchedules = (schedulesData || [])
            .filter(schedule => !schedule.subject_schedule_id)
            .map(schedule => ({
              id: schedule.id,
              dayOfWeek: schedule.day_of_week,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              subjectScheduleId: ''
            }));

          return {
            id: member.id,
            name: member.name,
            roles: rolesData ? rolesData.map(r => r.role as StaffRole) : [member.role as StaffRole], // Fallback to old role if no new roles
            photoUrl: member.photo_url,
            email: member.email || undefined,
            schedules: legacySchedules,
            subjectSchedules: subjectSchedules,
            leaveDates: leaveDatesData ? leaveDatesData.map((leave: any) => ({
              id: leave.id,
              startDate: leave.start_date,
              endDate: leave.end_date,
            })) as LeaveDate[] : [],
          } as StaffMember;
        })
      );

      setStaff(staffMembers);
    } catch (error: any) {
      console.error("Error loading staff:", error.message);
      toast({
        title: "Error loading staff",
        description: error.message || "Could not load staff. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addStaffMember = async (
    name: string,
    roles: StaffRole[], // Changed to accept multiple roles
    photoUrl?: string,
    schedules: Omit<Schedule, "id">[] = [],
    email?: string,
    subjectSchedules: SubjectSchedule[] = []
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Insert the staff member (keeping the role field for backward compatibility)
      const { data, error } = await supabase
        .from("staff_members")
        .insert({
          name,
          role: roles[0] || 'Photographer', // Use first role as primary for backward compatibility
          photo_url: photoUrl,
          user_id: user.id,
          email: email,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Insert roles into staff_roles table
      if (roles.length > 0) {
        const rolesToInsert = roles.map((role) => ({
          staff_id: data.id,
          user_id: user.id,
          role: role,
        }));

        const { error: rolesError } = await supabase
          .from("staff_roles")
          .insert(rolesToInsert);

        if (rolesError) {
          throw rolesError;
        }
      }

      // Insert subject schedules and their associated schedules
      for (const subjectSchedule of subjectSchedules) {
        const { data: subjectData, error: subjectError } = await supabase
          .from("subject_schedules")
          .insert({
            staff_id: data.id,
            user_id: user.id,
            subject: subjectSchedule.subject,
          })
          .select()
          .single();

        if (subjectError) {
          throw subjectError;
        }

        if (subjectSchedule.schedules.length > 0) {
          const schedulesToInsert = subjectSchedule.schedules.map((schedule) => ({
            staff_id: data.id,
            user_id: user.id,
            day_of_week: schedule.dayOfWeek,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            subject_schedule_id: subjectData.id,
          }));

          const { error: scheduleError } = await supabase
            .from("schedules")
            .insert(schedulesToInsert);

          if (scheduleError) {
            throw scheduleError;
          }
        }
      }

      // Insert legacy schedules if any (for backward compatibility)
      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map((schedule) => ({
          staff_id: data.id,
          user_id: user.id,
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
        }));

        const { error: scheduleError } = await supabase
          .from("schedules")
          .insert(schedulesToInsert);

        if (scheduleError) {
          throw scheduleError;
        }
      }

      await loadStaff();

      toast({
        title: "Staff Member Added",
        description: `${name} has been successfully added with roles: ${roles.join(', ')}.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error adding staff member:", error.message);
      toast({
        title: "Error adding staff member",
        description: error.message || "Could not add staff member. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStaffMember = async (
    id: string,
    updates: {
      name?: string;
      roles?: StaffRole[]; // Changed to support multiple roles
      photoUrl?: string;
      email?: string;
      schedules?: {
        toAdd: Omit<Schedule, "id">[];
        toUpdate: Schedule[];
        toDelete: string[];
      };
      subjectSchedules?: SubjectSchedule[];
      leaveDates?: LeaveDate[];
    }
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Update the staff member
      const staffUpdates: any = {};
      if (updates.name) staffUpdates.name = updates.name;
      if (updates.roles && updates.roles.length > 0) staffUpdates.role = updates.roles[0]; // Keep primary role for backward compatibility
      if (updates.photoUrl !== undefined) staffUpdates.photo_url = updates.photoUrl;
      if (updates.email !== undefined) staffUpdates.email = updates.email || null;

      if (Object.keys(staffUpdates).length > 0) {
        const { error } = await supabase
          .from("staff_members")
          .update(staffUpdates)
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }
      }

      // Handle roles if provided
      if (updates.roles !== undefined) {
        // Delete all existing roles
        const { error: deleteRolesError } = await supabase
          .from("staff_roles")
          .delete()
          .eq("staff_id", id);

        if (deleteRolesError) {
          throw deleteRolesError;
        }

        // Insert new roles
        if (updates.roles.length > 0) {
          const rolesToInsert = updates.roles.map((role) => ({
            staff_id: id,
            user_id: user.id,
            role: role,
          }));

          const { error: insertRolesError } = await supabase
            .from("staff_roles")
            .insert(rolesToInsert);

          if (insertRolesError) {
            throw insertRolesError;
          }
        }
      }

      // Handle subject schedules if provided
      if (updates.subjectSchedules !== undefined) {
        // Delete all existing subject schedules and their schedules
        const { error: deleteSubjectSchedulesError } = await supabase
          .from("subject_schedules")
          .delete()
          .eq("staff_id", id);

        if (deleteSubjectSchedulesError) {
          throw deleteSubjectSchedulesError;
        }

        // Insert new subject schedules
        for (const subjectSchedule of updates.subjectSchedules) {
          const { data: subjectData, error: subjectError } = await supabase
            .from("subject_schedules")
            .insert({
              staff_id: id,
              user_id: user.id,
              subject: subjectSchedule.subject,
            })
            .select()
            .single();

          if (subjectError) {
            throw subjectError;
          }

          if (subjectSchedule.schedules.length > 0) {
            const schedulesToInsert = subjectSchedule.schedules.map((schedule) => ({
              staff_id: id,
              user_id: user.id,
              day_of_week: schedule.dayOfWeek,
              start_time: schedule.startTime,
              end_time: schedule.endTime,
              subject_schedule_id: subjectData.id,
            }));

            const { error: scheduleError } = await supabase
              .from("schedules")
              .insert(schedulesToInsert);

            if (scheduleError) {
              throw scheduleError;
            }
          }
        }
      }

      // Handle legacy schedules if provided (for backward compatibility)
      if (updates.schedules) {
        // Delete legacy schedules (ones without subject_schedule_id)
        if (updates.schedules.toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("schedules")
            .delete()
            .in("id", updates.schedules.toDelete)
            .is("subject_schedule_id", null);

          if (deleteError) {
            throw deleteError;
          }
        }

        // Add new legacy schedules
        if (updates.schedules.toAdd.length > 0) {
          const schedulesToAdd = updates.schedules.toAdd.map((schedule) => ({
            staff_id: id,
            user_id: user.id,
            day_of_week: schedule.dayOfWeek,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
          }));

          const { error: addError } = await supabase
            .from("schedules")
            .insert(schedulesToAdd);

          if (addError) {
            throw addError;
          }
        }

        // Update existing legacy schedules
        for (const schedule of updates.schedules.toUpdate) {
          const { error: updateError } = await supabase
            .from("schedules")
            .update({
              day_of_week: schedule.dayOfWeek,
              start_time: schedule.startTime,
              end_time: schedule.endTime,
            })
            .eq("id", schedule.id);

          if (updateError) {
            throw updateError;
          }
        }
      }

      // Handle leave dates if provided
      if (updates.leaveDates !== undefined) {
        // First, delete all existing leave dates for this staff member
        const { error: deleteLeaveError } = await (supabase as any)
          .from("leave_dates")
          .delete()
          .eq("staff_id", id);

        if (deleteLeaveError) {
          throw deleteLeaveError;
        }

        // Then, insert the new leave dates (excluding temporary IDs)
        if (updates.leaveDates.length > 0) {
          const leaveDatesToInsert = updates.leaveDates.map((leave) => ({
            staff_id: id,
            user_id: user.id,
            start_date: leave.startDate,
            end_date: leave.endDate,
          }));

          const { error: insertLeaveError } = await (supabase as any)
            .from("leave_dates")
            .insert(leaveDatesToInsert);

          if (insertLeaveError) {
            throw insertLeaveError;
          }
        }
      }

      await loadStaff();

      toast({
        title: "Staff Member Updated",
        description: "Staff member has been successfully updated.",
      });

      return true;
    } catch (error: any) {
      console.error("Error updating staff member:", error.message);
      toast({
        title: "Error updating staff member",
        description: error.message || "Could not update staff member. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteStaffMember = async (id: string) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Delete staff roles first
      const { error: rolesError } = await supabase
        .from("staff_roles")
        .delete()
        .eq("staff_id", id);

      if (rolesError) {
        throw rolesError;
      }

      // Delete subject schedules (this will cascade delete related schedules)
      const { error: subjectSchedulesError } = await supabase
        .from("subject_schedules")
        .delete()
        .eq("staff_id", id);

      if (subjectSchedulesError) {
        throw subjectSchedulesError;
      }

      // Delete any remaining legacy schedules
      const { error: scheduleError } = await supabase
        .from("schedules")
        .delete()
        .eq("staff_id", id);

      if (scheduleError) {
        throw scheduleError;
      }

      // Delete all leave dates for this staff member
      const { error: leaveError } = await (supabase as any)
        .from("leave_dates")
        .delete()
        .eq("staff_id", id);

      if (leaveError) {
        throw leaveError;
      }

      // Then, delete all staff assignments for this staff member
      const { error: assignmentError } = await supabase
        .from("staff_assignments")
        .delete()
        .eq("staff_id", id);

      if (assignmentError) {
        throw assignmentError;
      }

      // Finally, delete the staff member
      const { error } = await supabase
        .from("staff_members")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setStaff(staff.filter((s) => s.id !== id));

      toast({
        title: "Staff Member Deleted",
        description: "Staff member has been successfully deleted.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting staff member:", error.message);
      toast({
        title: "Error deleting staff member",
        description: error.message || "Could not delete staff member. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getStaffByRole = (role: StaffRole) => {
    return staff.filter((member) => member.roles.includes(role));
  };

  const getStaffById = (id: string) => {
    return staff.find((member) => member.id === id) || null;
  };

  const getAvailableStaff = useCallback((
    eventDate: string,
    startTime: string,
    endTime: string,
    ignoreScheduleConflicts: boolean = false
  ) => {
    console.log('Getting available staff for:', { eventDate, startTime, endTime, ignoreScheduleConflicts });
    
    const filteredStaff = staff.filter(member => {
      const isOnLeave = member.leaveDates?.some(leave => {
        const leaveStart = parseISO(leave.startDate);
        const leaveEnd = parseISO(leave.endDate);
        const eventDateObj = parseISO(eventDate);
        return isWithinInterval(eventDateObj, { start: leaveStart, end: leaveEnd });
      });
      
      if (isOnLeave) {
        console.log(`${member.name} is on leave, excluding from available staff`);
        return false;
      }

      if (ignoreScheduleConflicts) {
        return true;
      }

      const eventDay = getDay(parseISO(eventDate));
      
      // Check both legacy schedules and subject schedules
      const allSchedules = [
        ...member.schedules,
        ...member.subjectSchedules.flatMap(ss => ss.schedules)
      ];
      
      const hasScheduleConflict = allSchedules.some(schedule => {
        if (schedule.dayOfWeek !== eventDay) return false;
        
        const scheduleStart = parseISO(`${eventDate}T${schedule.startTime}`);
        const scheduleEnd = parseISO(`${eventDate}T${schedule.endTime}`);
        const eventStart = parseISO(`${eventDate}T${startTime}`);
        const eventEnd = parseISO(`${eventDate}T${endTime}`);
        
        return (
          isBefore(eventStart, scheduleEnd) && 
          isAfter(eventEnd, scheduleStart)
        );
      });
      
      return !hasScheduleConflict;
    });

    const videographers = filteredStaff.filter(member => member.roles.includes('Videographer'));
    const photographers = filteredStaff.filter(member => member.roles.includes('Photographer'));
    
    console.log('Available videographers:', videographers.map(v => v.name));
    console.log('Available photographers:', photographers.map(p => p.name));
    
    return { videographers, photographers };
  }, [staff]);

  // Load staff on initialization
  useEffect(() => {
    if (user) {
      loadStaff();
    }
  }, [user]);

  return {
    staff,
    loading,
    loadStaff,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember: async (id: string) => {
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Delete staff roles first
        const { error: rolesError } = await supabase
          .from("staff_roles")
          .delete()
          .eq("staff_id", id);

        if (rolesError) {
          throw rolesError;
        }

        // Delete subject schedules (this will cascade delete related schedules)
        const { error: subjectSchedulesError } = await supabase
          .from("subject_schedules")
          .delete()
          .eq("staff_id", id);

        if (subjectSchedulesError) {
          throw subjectSchedulesError;
        }

        // Delete any remaining legacy schedules
        const { error: scheduleError } = await supabase
          .from("schedules")
          .delete()
          .eq("staff_id", id);

        if (scheduleError) {
          throw scheduleError;
        }

        // Delete all leave dates for this staff member
        const { error: leaveError } = await (supabase as any)
          .from("leave_dates")
          .delete()
          .eq("staff_id", id);

        if (leaveError) {
          throw leaveError;
        }

        // Then, delete all staff assignments for this staff member
        const { error: assignmentError } = await supabase
          .from("staff_assignments")
          .delete()
          .eq("staff_id", id);

        if (assignmentError) {
          throw assignmentError;
        }

        // Finally, delete the staff member
        const { error } = await supabase
          .from("staff_members")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        setStaff(staff.filter((s) => s.id !== id));

        toast({
          title: "Staff Member Deleted",
          description: "Staff member has been successfully deleted.",
        });

        return true;
      } catch (error: any) {
        console.error("Error deleting staff member:", error.message);
        toast({
          title: "Error deleting staff member",
          description: error.message || "Could not delete staff member. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    getStaffByRole,
    getStaffById,
    getAvailableStaff
  };
}
