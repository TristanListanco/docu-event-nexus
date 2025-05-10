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
      
      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .eq('user_id', user.id);
        
      if (staffError) {
        throw staffError;
      }
      
      // For each staff member, fetch their schedules
      const staffWithSchedules = await Promise.all(staffData.map(async (member) => {
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedules')
          .select('*')
          .eq('staff_id', member.id);
          
        if (scheduleError) {
          console.error("Error fetching schedules:", scheduleError);
          return {
            id: member.id,
            name: member.name,
            role: member.role as StaffRole,
            photoUrl: member.photo_url || undefined,
            schedules: [],
            statistics: {
              completed: 0,
              absent: 0,
              excused: 0
            }
          };
        }
        
        // Fix: Use correct typing for the RPC function parameters
        const { data: assignmentsData } = await supabase.rpc(
          'count_staff_assignments', 
          { staff_id_param: member.id }
        );
        
        // Fix: Check if assignmentsData is null
        const statistics = assignmentsData && assignmentsData[0] ? assignmentsData[0] : {
          completed: 0,
          absent: 0,
          excused: 0
        };
        
        // Map schedules to the correct type
        const schedules: Schedule[] = scheduleData.map(schedule => ({
          id: schedule.id,
          dayOfWeek: schedule.day_of_week,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          subject: schedule.subject
        }));
        
        return {
          id: member.id,
          name: member.name,
          role: member.role as StaffRole,
          photoUrl: member.photo_url || undefined,
          schedules,
          statistics
        };
      }));
      
      setStaff(staffWithSchedules);
    } catch (error: any) {
      console.error("Error loading staff:", error);
      toast({
        title: "Failed to load staff",
        description: error.message || "An error occurred while loading staff",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const createStaffMember = async (
    staffData: { 
      name: string; 
      role: StaffRole;
      email?: string;
      photoUrl?: string;
      schedules: Omit<Schedule, "id">[];
    }
  ) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      // First, create the staff member
      const { data: newStaff, error: staffError } = await supabase
        .from('staff_members')
        .insert({
          user_id: user.id,
          name: staffData.name,
          role: staffData.role,
          photo_url: staffData.photoUrl || null
        })
        .select()
        .single();
        
      if (staffError) {
        throw staffError;
      }
      
      // Then, create all schedules
      if (staffData.schedules.length > 0) {
        const schedulesToInsert = staffData.schedules.map(schedule => ({
          staff_id: newStaff.id,
          user_id: user.id,
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          subject: schedule.subject
        }));
        
        const { data: newSchedules, error: scheduleError } = await supabase
          .from('schedules')
          .insert(schedulesToInsert)
          .select();
          
        if (scheduleError) {
          throw scheduleError;
        }
        
        // Format schedules to the correct type
        const formattedSchedules: Schedule[] = newSchedules.map(schedule => ({
          id: schedule.id,
          dayOfWeek: schedule.day_of_week,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          subject: schedule.subject
        }));
        
        // Create new staff object with schedules
        const staffMember: StaffMember = {
          id: newStaff.id,
          name: newStaff.name,
          role: newStaff.role as StaffRole,
          photoUrl: newStaff.photo_url || undefined,
          schedules: formattedSchedules,
          statistics: {
            completed: 0,
            absent: 0,
            excused: 0
          }
        };
        
        setStaff(prevStaff => [...prevStaff, staffMember]);
        
        toast({
          title: "Staff Member Added",
          description: `${staffData.name} has been added as a ${staffData.role}.`,
        });
        
        return staffMember;
      } else {
        // Create new staff object without schedules
        const staffMember: StaffMember = {
          id: newStaff.id,
          name: newStaff.name,
          role: newStaff.role as StaffRole,
          photoUrl: newStaff.photo_url || undefined,
          schedules: [],
          statistics: {
            completed: 0,
            absent: 0,
            excused: 0
          }
        };
        
        setStaff(prevStaff => [...prevStaff, staffMember]);
        
        toast({
          title: "Staff Member Added",
          description: `${staffData.name} has been added as a ${staffData.role}.`,
        });
        
        return staffMember;
      }
    } catch (error: any) {
      console.error("Error creating staff member:", error);
      toast({
        title: "Failed to add staff member",
        description: error.message || "An error occurred while adding the staff member",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Load staff on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadStaff();
    } else {
      setStaff([]);
    }
  }, [user]);
  
  return { staff, loading, loadStaff, createStaffMember };
};
