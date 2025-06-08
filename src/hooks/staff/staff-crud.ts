
import { supabase } from "@/integrations/supabase/client";
import { StaffMember, StaffRole } from "@/types/models";
import { toast } from "@/hooks/use-toast";

export const loadStaffFromDatabase = async (userId: string): Promise<StaffMember[]> => {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("user_id", userId);

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

  return staffMembers;
};

export const addStaffToDatabase = async (
  userId: string,
  staffData: Omit<StaffMember, "id">
) => {
  const { data, error } = await supabase
    .from("staff_members")
    .insert({
      name: staffData.name,
      email: staffData.email,
      role: staffData.roles[0],
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  toast({
    title: "Staff Added",
    description: `${staffData.name} has been added successfully.`,
  });

  return data;
};

export const updateStaffInDatabase = async (
  userId: string,
  staffId: string,
  staffData: Partial<Omit<StaffMember, "id">>
) => {
  const { data, error } = await supabase
    .from("staff_members")
    .update({
      name: staffData.name,
      email: staffData.email,
      role: staffData.roles?.[0],
    })
    .eq("id", staffId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  toast({
    title: "Staff Updated",
    description: `${staffData.name} has been updated successfully.`,
  });

  return data;
};

export const deleteStaffFromDatabase = async (
  userId: string,
  staffId: string
) => {
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
