
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

  // Delete existing staff assignments
  const { error: deleteError } = await supabase
    .from("staff_assignments")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) {
    throw deleteError;
  }

  console.log("Staff assignments to process:", { videographerIds, photographerIds });

  // Filter out "none" values and ensure we have valid staff IDs
  const validVideographerIds = videographerIds ? videographerIds.filter(id => id && id !== "none") : [];
  const validPhotographerIds = photographerIds ? photographerIds.filter(id => id && id !== "none") : [];

  console.log("Valid staff IDs after filtering:", { validVideographerIds, validPhotographerIds });

  await insertStaffAssignments(userId, eventId, validVideographerIds, validPhotographerIds);
};
