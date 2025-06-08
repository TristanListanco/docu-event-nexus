
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

      const { data, error } = await supabase
        .from("staff_members")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      const staffMembers: StaffMember[] = data.map((staffMember) => ({
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        roles: [staffMember.role] as StaffRole[],
        schedules: [],
        subjectSchedules: [],
        leaveDates: [],
      }));

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

  const addStaff = async (staffData: Omit<StaffMember, "id">) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("staff_members")
        .insert({
          name: staffData.name,
          email: staffData.email,
          role: staffData.roles[0],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh the staff list
      await loadStaff();

      toast({
        title: "Staff Added",
        description: `${staffData.name} has been added successfully.`,
      });

      return data;
    } catch (error: any) {
      console.error("Error adding staff:", error.message);
      toast({
        title: "Error Adding Staff",
        description: error.message || "Could not add staff. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStaff = async (
    staffId: string,
    staffData: Partial<Omit<StaffMember, "id">>
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("staff_members")
        .update({
          name: staffData.name,
          email: staffData.email,
          role: staffData.roles?.[0],
        })
        .eq("id", staffId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh the staff list
      await loadStaff();

      toast({
        title: "Staff Updated",
        description: `${staffData.name} has been updated successfully.`,
      });

      return data;
    } catch (error: any) {
      console.error("Error updating staff:", error.message);
      toast({
        title: "Error Updating Staff",
        description: error.message || "Could not update staff. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteStaff = async (staffId: string) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("staff_members")
        .delete()
        .eq("id", staffId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Update the local state by removing the deleted staff member
      setStaff(staff.filter((staffMember) => staffMember.id !== staffId));

      toast({
        title: "Staff Deleted",
        description: "The staff member has been successfully deleted.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting staff:", error.message);
      toast({
        title: "Error Deleting Staff",
        description: error.message || "Could not delete staff. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getAvailableStaff = (
    eventDate: string,
    startTime: string,
    endTime: string,
    ignoreScheduleConflicts: boolean = false,
    ccsOnlyEvent: boolean = false
  ) => {
    if (!eventDate || !startTime || !endTime) {
      return { videographers: [], photographers: [] };
    }

    const eventDay = new Date(eventDate).getDay();
    const ccsSubjectCodes = ['BCA', 'CCC', 'CSC', 'ISY', 'ITE', 'ITN', 'ITD'];

    const availableStaff = staff.filter(member => {
      // Check if member is on leave
      const isOnLeave = member.leaveDates.some(leave => 
        eventDate >= leave.startDate && eventDate <= leave.endDate
      );
      
      if (isOnLeave) {
        return false;
      }

      // If ignoring schedule conflicts, return all non-leave staff
      if (ignoreScheduleConflicts) {
        return true;
      }

      // Check schedule conflicts
      const hasConflict = member.schedules.some(schedule => {
        if (schedule.dayOfWeek !== eventDay) {
          return false;
        }

        // If it's a CCS-only event and this schedule is for a CCS subject, treat as available
        if (ccsOnlyEvent && schedule.subject && ccsSubjectCodes.includes(schedule.subject)) {
          return false; // No conflict because CCS classes are suspended
        }

        // Check time overlap
        const scheduleStart = schedule.startTime;
        const scheduleEnd = schedule.endTime;
        
        // Check if event time overlaps with schedule time
        return (
          (startTime >= scheduleStart && startTime < scheduleEnd) ||
          (endTime > scheduleStart && endTime <= scheduleEnd) ||
          (startTime <= scheduleStart && endTime >= scheduleEnd)
        );
      });

      return !hasConflict;
    });

    return {
      videographers: availableStaff.filter(member => 
        member.roles.includes("Videographer")
      ),
      photographers: availableStaff.filter(member => 
        member.roles.includes("Photographer")
      ),
    };
  };

  // Load staff on initialization and when user changes
  useEffect(() => {
    if (user) {
      loadStaff();
    }
  }, [user]);

  return {
    staff,
    loading,
    loadStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    getAvailableStaff,
  };
}
