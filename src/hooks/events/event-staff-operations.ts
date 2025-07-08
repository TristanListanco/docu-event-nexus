
import { supabase } from "@/integrations/supabase/client";
import { AttendanceStatus } from "@/types/models";

export const insertStaffAssignments = async (
  userId: string,
  eventId: string,
  videographerIds: string[],
  photographerIds: string[]
) => {
  // Insert staff assignments for videographers
  if (videographerIds.length > 0) {
    const videographerAssignments = videographerIds.map(staffId => ({
      user_id: userId,
      event_id: eventId,
      staff_id: staffId,
      attendance_status: "Pending" as AttendanceStatus
    }));

    const { error: videographerError } = await supabase
      .from("staff_assignments")
      .insert(videographerAssignments);

    if (videographerError) {
      throw videographerError;
    }
  }

  // Insert staff assignments for photographers
  if (photographerIds.length > 0) {
    const photographerAssignments = photographerIds.map(staffId => ({
      user_id: userId,
      event_id: eventId,
      staff_id: staffId,
      attendance_status: "Pending" as AttendanceStatus
    }));

    const { error: photographerError } = await supabase
      .from("staff_assignments")
      .insert(photographerAssignments);

    if (photographerError) {
      throw photographerError;
    }
  }
};

export const updateStaffAssignments = async (
  userId: string,
  eventId: string,
  videographerIds?: string[],
  photographerIds?: string[]
) => {
  if (videographerIds === undefined && photographerIds === undefined) {
    return;
  }

  console.log("Staff assignments to process:", { videographerIds, photographerIds });

  // Filter out "none" values and ensure we have valid staff IDs
  const validVideographerIds = videographerIds ? videographerIds.filter(id => id && id !== "none") : [];
  const validPhotographerIds = photographerIds ? photographerIds.filter(id => id && id !== "none") : [];

  console.log("Valid staff IDs after filtering:", { validVideographerIds, validPhotographerIds });

  // Get all unique staff IDs that should be assigned
  const allNewStaffIds = [...new Set([...validVideographerIds, ...validPhotographerIds])];
  
  // Get current assignments for this event
  const { data: currentAssignments, error: fetchError } = await supabase
    .from("staff_assignments")
    .select("staff_id, id")
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (fetchError) {
    throw fetchError;
  }

  const currentStaffIds = currentAssignments?.map(a => a.staff_id) || [];
  
  // Find staff to add (new assignments)
  const staffToAdd = allNewStaffIds.filter(staffId => !currentStaffIds.includes(staffId));
  
  // Find staff to remove (assignments that should be deleted)
  const staffToRemove = currentStaffIds.filter(staffId => !allNewStaffIds.includes(staffId));

  console.log("Staff assignment changes:", { staffToAdd, staffToRemove });

  // Remove staff assignments that are no longer needed
  if (staffToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("staff_assignments")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .in("staff_id", staffToRemove);

    if (deleteError) {
      throw deleteError;
    }
  }

  // Add new staff assignments
  if (staffToAdd.length > 0) {
    const newAssignments = staffToAdd.map(staffId => ({
      user_id: userId,
      event_id: eventId,
      staff_id: staffId,
      attendance_status: "Pending" as AttendanceStatus
    }));

    const { error: insertError } = await supabase
      .from("staff_assignments")
      .insert(newAssignments);

    if (insertError) {
      throw insertError;
    }
  }

  console.log("Staff assignment update completed:", {
    added: staffToAdd,
    removed: staffToRemove
  });
};
