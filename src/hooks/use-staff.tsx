
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { StaffMember, Schedule, StaffRole } from "@/types/models";
import { toast } from "./use-toast";

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

      // Fetch schedules for each staff member
      const staffMembers: StaffMember[] = await Promise.all(
        staffData.map(async (member) => {
          const { data: schedulesData, error: schedulesError } = await supabase
            .from("schedules")
            .select("*")
            .eq("staff_id", member.id);

          if (schedulesError) {
            console.error("Error loading schedules:", schedulesError.message);
            return {
              ...member,
              schedules: [],
            } as StaffMember;
          }

          return {
            id: member.id,
            name: member.name,
            role: member.role,
            photoUrl: member.photo_url,
            schedules: schedulesData.map((schedule) => ({
              id: schedule.id,
              dayOfWeek: schedule.day_of_week,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              subject: schedule.subject,
            })) as Schedule[],
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
    role: StaffRole,
    photoUrl?: string,
    schedules: Omit<Schedule, "id">[] = []
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Insert the staff member
      const { data, error } = await supabase
        .from("staff_members")
        .insert({
          name,
          role,
          photo_url: photoUrl,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Insert schedules if any
      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map((schedule) => ({
          staff_id: data.id,
          user_id: user.id,
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          subject: schedule.subject,
        }));

        const { error: scheduleError } = await supabase
          .from("schedules")
          .insert(schedulesToInsert);

        if (scheduleError) {
          throw scheduleError;
        }
      }

      // Reload staff to get the updated list with schedules
      await loadStaff();

      toast({
        title: "Staff Member Added",
        description: `${name} has been successfully added as ${role}.`,
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
      role?: StaffRole;
      photoUrl?: string;
      schedules?: {
        toAdd: Omit<Schedule, "id">[];
        toUpdate: Schedule[];
        toDelete: string[];
      };
    }
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Update the staff member
      const staffUpdates: any = {};
      if (updates.name) staffUpdates.name = updates.name;
      if (updates.role) staffUpdates.role = updates.role;
      if (updates.photoUrl !== undefined) staffUpdates.photo_url = updates.photoUrl;

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

      // Handle schedules if provided
      if (updates.schedules) {
        // Delete schedules
        if (updates.schedules.toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("schedules")
            .delete()
            .in("id", updates.schedules.toDelete);

          if (deleteError) {
            throw deleteError;
          }
        }

        // Add new schedules
        if (updates.schedules.toAdd.length > 0) {
          const schedulesToAdd = updates.schedules.toAdd.map((schedule) => ({
            staff_id: id,
            user_id: user.id,
            day_of_week: schedule.dayOfWeek,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            subject: schedule.subject,
          }));

          const { error: addError } = await supabase
            .from("schedules")
            .insert(schedulesToAdd);

          if (addError) {
            throw addError;
          }
        }

        // Update existing schedules
        for (const schedule of updates.schedules.toUpdate) {
          const { error: updateError } = await supabase
            .from("schedules")
            .update({
              day_of_week: schedule.dayOfWeek,
              start_time: schedule.startTime,
              end_time: schedule.endTime,
              subject: schedule.subject,
            })
            .eq("id", schedule.id);

          if (updateError) {
            throw updateError;
          }
        }
      }

      // Reload staff to get the updated list with schedules
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

      // First, delete all schedules for this staff member
      const { error: scheduleError } = await supabase
        .from("schedules")
        .delete()
        .eq("staff_id", id);

      if (scheduleError) {
        throw scheduleError;
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

      // Update the local state by removing the deleted staff member
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
    return staff.filter((member) => member.role === role);
  };

  const getStaffById = (id: string) => {
    return staff.find((member) => member.id === id) || null;
  };

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
    deleteStaffMember,
    getStaffByRole,
    getStaffById,
  };
}
