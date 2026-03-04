import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { StaffMember, StaffAvailability } from "@/types/models";
import { toast } from "./use-toast";
import { getAvailableStaff } from "./staff/staff-availability";
import { getEnhancedStaffAvailability } from "./staff/enhanced-staff-availability";
import { 
  loadStaffFromDatabase, 
  addStaffToDatabase, 
  updateStaffInDatabase, 
  deleteStaffFromDatabase 
} from "./staff/staff-crud";
import { supabase } from "@/integrations/supabase/client";

export function useStaff(termId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: staff = [], 
    isLoading: loading, 
    refetch: loadStaff,
    isFetching
  } = useQuery({
    queryKey: ['staff', user?.id, termId],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return await loadStaffFromDatabase(user.id, termId);
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    networkMode: 'online',
    placeholderData: (previousData) => previousData,
  });

  // Fetch leave dates separately
  const { data: leaveDates = [] } = useQuery({
    queryKey: ['leaveDates', user?.id, termId],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      let query = supabase
        .from('leave_dates')
        .select('*')
        .eq('user_id', user.id);

      if (termId) {
        query = query.eq('term_id', termId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const addStaff = async (staffData: Omit<StaffMember, "id">) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const data = await addStaffToDatabase(user.id, staffData, termId);
      
      queryClient.invalidateQueries({ queryKey: ['staff', user.id, termId] });

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

      const data = await updateStaffInDatabase(user.id, staffId, staffData);
      
      queryClient.invalidateQueries({ queryKey: ['staff', user.id, termId] });

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

      await deleteStaffFromDatabase(user.id, staffId);

      queryClient.invalidateQueries({ queryKey: ['staff', user.id, termId] });

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

  const getAvailableStaffForEvent = (
    eventDate: string,
    startTime: string,
    endTime: string,
    ignoreScheduleConflicts: boolean = false,
    ccsOnlyEvent: boolean = false
  ): StaffAvailability[] => {
    if (!staff || staff.length === 0) {
      return [];
    }

    // Use enhanced availability logic that properly calculates partial availability
    return getEnhancedStaffAvailability(
      staff,
      eventDate,
      startTime,
      endTime,
      ignoreScheduleConflicts,
      ccsOnlyEvent,
      leaveDates || []
    );
  };

  return {
    staff,
    leaveDates,
    loading,
    loadStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    getAvailableStaff: getAvailableStaffForEvent,
    // Add isFetching to distinguish between initial load and background refresh
    isRefreshing: isFetching && !loading,
  };
}
