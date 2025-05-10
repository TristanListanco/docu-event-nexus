
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { StaffMember, StaffRole, Schedule } from "@/types/models";

export const useStaff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const loadStaff = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load staff members
      const { data: staffData, error: staffError } = await supabase
        .from("staff_members")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      
      if (staffError) {
        throw staffError;
      }
      
      // Map database staff to StaffMember type
      let mappedStaff = staffData.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role as StaffRole,
        photoUrl: s.photo_url || undefined,
        schedules: [] as Schedule[],
        statistics: {
          completed: 0,
          absent: 0,
          excused: 0
        }
      }));
      
      // Load schedules for all staff members
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id);
      
      if (schedulesError) {
        throw schedulesError;
      }
      
      // Assign schedules to respective staff members
      if (schedulesData && schedulesData.length > 0) {
        mappedStaff = mappedStaff.map(staffMember => {
          const memberSchedules = schedulesData
            .filter(schedule => schedule.staff_id === staffMember.id)
            .map(schedule => ({
              id: schedule.id,
              dayOfWeek: schedule.day_of_week,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              subject: schedule.subject
            }));
          
          return {
            ...staffMember,
            schedules: memberSchedules
          };
        });
      }
      
      setStaff(mappedStaff);
    } catch (error: any) {
      console.error("Error loading staff:", error);
      toast({
        title: "Failed to load staff",
        description: error.message || "An error occurred while loading staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const createStaffMember = async (staffData: { 
    name: string; 
    role: StaffRole; 
    schedules: Omit<Schedule, "id">[] 
  }) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      // Insert staff member
      const { data: newStaff, error: staffError } = await supabase
        .from("staff_members")
        .insert({
          user_id: user.id,
          name: staffData.name,
          role: staffData.role,
        })
        .select()
        .single();
      
      if (staffError) {
        throw staffError;
      }
      
      // Insert schedules if any
      if (staffData.schedules.length > 0) {
        const schedulesWithIds = staffData.schedules.map(schedule => ({
          user_id: user.id,
          staff_id: newStaff.id,
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          subject: schedule.subject
        }));
        
        const { error: schedulesError } = await supabase
          .from("schedules")
          .insert(schedulesWithIds);
        
        if (schedulesError) {
          throw schedulesError;
        }
      }
      
      // Reload staff to get latest data
      await loadStaff();
      
      toast({
        title: "Staff Member Created",
        description: `${staffData.name} has been added successfully.`,
      });
      
      return newStaff;
    } catch (error: any) {
      console.error("Error creating staff member:", error);
      toast({
        title: "Failed to create staff member",
        description: error.message || "An error occurred while creating the staff member",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateStaffMember = async (
    staffId: string, 
    staffData: {
      name?: string;
      role?: StaffRole;
      schedules?: Omit<Schedule, "id">[];
    }
  ) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      // Update staff member basic info
      if (staffData.name || staffData.role !== undefined) {
        const updateData: any = {};
        if (staffData.name) updateData.name = staffData.name;
        if (staffData.role !== undefined) updateData.role = staffData.role;
        
        const { error: staffError } = await supabase
          .from("staff_members")
          .update(updateData)
          .eq("id", staffId)
          .eq("user_id", user.id);
        
        if (staffError) {
          throw staffError;
        }
      }
      
      // Update schedules if provided
      if (staffData.schedules) {
        // First delete existing schedules
        const { error: deleteError } = await supabase
          .from("schedules")
          .delete()
          .eq("staff_id", staffId)
          .eq("user_id", user.id);
        
        if (deleteError) {
          throw deleteError;
        }
        
        // Then insert new schedules if any
        if (staffData.schedules.length > 0) {
          const schedulesWithIds = staffData.schedules.map(schedule => ({
            user_id: user.id,
            staff_id: staffId,
            day_of_week: schedule.dayOfWeek,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            subject: schedule.subject
          }));
          
          const { error: insertError } = await supabase
            .from("schedules")
            .insert(schedulesWithIds);
          
          if (insertError) {
            throw insertError;
          }
        }
      }
      
      // Reload staff to get fresh data
      await loadStaff();
      
      toast({
        title: "Staff Member Updated",
        description: "Staff member has been updated successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating staff member:", error);
      toast({
        title: "Failed to update staff member",
        description: error.message || "An error occurred while updating the staff member",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteStaffMember = async (staffId: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      // Delete schedules first (foreign key constraint)
      const { error: schedulesError } = await supabase
        .from("schedules")
        .delete()
        .eq("staff_id", staffId)
        .eq("user_id", user.id);
      
      if (schedulesError) {
        throw schedulesError;
      }
      
      // Then delete staff member
      const { error: staffError } = await supabase
        .from("staff_members")
        .delete()
        .eq("id", staffId)
        .eq("user_id", user.id);
      
      if (staffError) {
        throw staffError;
      }
      
      // Update local state
      setStaff(staff.filter(s => s.id !== staffId));
      
      toast({
        title: "Staff Member Deleted",
        description: "Staff member has been deleted successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error deleting staff member:", error);
      toast({
        title: "Failed to delete staff member",
        description: error.message || "An error occurred while deleting the staff member",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get all available staff for an event time slot
  const getAvailableStaff = (date: string, startTime: string, endTime: string) => {
    if (!staff.length) return { videographers: [], photographers: [] };

    // Filter staff based on schedule conflicts for the given time
    const availableStaff = staff.filter(member => {
      // Get the day of week (0-6, where 0 is Sunday)
      const dayOfWeek = new Date(date).getDay();
      
      // Check if staff has a schedule on this day that overlaps with the event time
      const hasConflict = member.schedules.some(schedule => {
        if (schedule.dayOfWeek !== dayOfWeek) return false;
        
        // Check for time overlap
        // Convert times to comparable format (minutes since midnight)
        const eventStart = timeToMinutes(startTime);
        const eventEnd = timeToMinutes(endTime);
        const scheduleStart = timeToMinutes(schedule.startTime);
        const scheduleEnd = timeToMinutes(schedule.endTime);
        
        // Check if there's an overlap
        return (
          (eventStart >= scheduleStart && eventStart < scheduleEnd) || // Event starts during schedule
          (eventEnd > scheduleStart && eventEnd <= scheduleEnd) || // Event ends during schedule
          (eventStart <= scheduleStart && eventEnd >= scheduleEnd) // Event completely covers schedule
        );
      });
      
      return !hasConflict;
    });
    
    // Split by role
    const videographers = availableStaff.filter(s => s.role === 'Videographer');
    const photographers = availableStaff.filter(s => s.role === 'Photographer');
    
    return { videographers, photographers };
  };
  
  // Helper function to convert time strings (HH:MM) to minutes for easier comparison
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Load staff on mount
  useEffect(() => {
    if (user) {
      loadStaff();
    } else {
      setStaff([]);
    }
  }, [user]);
  
  return { 
    staff, 
    loading, 
    loadStaff, 
    createStaffMember, 
    updateStaffMember, 
    deleteStaffMember,
    getAvailableStaff
  };
};
