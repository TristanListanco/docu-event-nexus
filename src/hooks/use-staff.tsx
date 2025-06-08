
import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { StaffMember } from "@/types/models";
import { toast } from "./use-toast";
import { getAvailableStaff } from "./staff/staff-availability";
import { 
  loadStaffFromDatabase, 
  addStaffToDatabase, 
  updateStaffInDatabase, 
  deleteStaffFromDatabase 
} from "./staff/staff-crud";

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

      const staffMembers = await loadStaffFromDatabase(user.id);
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

      const data = await addStaffToDatabase(user.id, staffData);
      
      // Refresh the staff list
      await loadStaff();

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
      
      // Refresh the staff list
      await loadStaff();

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

      // Update the local state by removing the deleted staff member
      setStaff(staff.filter((staffMember) => staffMember.id !== staffId));

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
  ) => {
    return getAvailableStaff(
      staff,
      eventDate,
      startTime,
      endTime,
      ignoreScheduleConflicts,
      ccsOnlyEvent
    );
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
    getAvailableStaff: getAvailableStaffForEvent,
  };
}
