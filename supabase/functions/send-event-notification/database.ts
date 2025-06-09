
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { StaffWithToken } from "./types.ts";

export async function getStaffWithTokens(
  assignedStaff: Array<{ id: string; name: string; email: string; role: string }>,
  eventId: string
): Promise<StaffWithToken[]> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  return await Promise.all(
    assignedStaff.map(async (staff) => {
      const { data: assignmentData, error } = await supabase
        .from("staff_assignments")
        .select("confirmation_token")
        .eq("event_id", eventId)
        .eq("staff_id", staff.id)
        .single();

      if (error) {
        console.error(`Error getting confirmation token for ${staff.name}:`, error);
        return { ...staff, confirmationToken: null };
      }

      return { ...staff, confirmationToken: assignmentData?.confirmation_token };
    })
  );
}
