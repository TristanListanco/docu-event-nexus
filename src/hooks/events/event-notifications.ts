
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface NotificationData {
  eventId: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  type: string;
  isUpdate?: boolean;
  changes?: any;
}

export const sendEventNotifications = async (
  notificationData: NotificationData,
  assignedStaffIds: string[],
  videographerIds: string[],
  isUpdate: boolean = false
) => {
  if (assignedStaffIds.length === 0) {
    const message = isUpdate 
      ? `${notificationData.eventName} has been successfully updated.`
      : `${notificationData.eventName} has been successfully created.`;
    
    toast({
      title: isUpdate ? "Event Updated" : "Event Created",
      description: message,
    });
    return;
  }

  try {
    const { data: staffData, error: staffError } = await supabase
      .from("staff_members")
      .select("id, name, email")
      .in("id", assignedStaffIds);

    if (staffError) {
      console.error("Error fetching staff for notifications:", staffError);
      throw staffError;
    }

    if (staffData && staffData.length > 0) {
      const { error: notificationError } = await supabase.functions.invoke('send-event-notification', {
        body: {
          ...notificationData,
          assignedStaff: staffData.map(staff => ({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: videographerIds.includes(staff.id) ? "Videographer" : "Photographer"
          }))
        }
      });

      if (notificationError) {
        console.error("Error sending notifications:", notificationError);
        toast({
          title: isUpdate ? "Event Updated" : "Event Created",
          description: `${notificationData.eventName} has been ${isUpdate ? 'updated' : 'created'}, but email notifications failed to send.`,
          variant: "default",
        });
      } else {
        toast({
          title: isUpdate ? "Event Updated" : "Event Created",
          description: `${notificationData.eventName} has been ${isUpdate ? 'updated' : 'created'} and email notifications sent to assigned staff.`,
        });
      }
    }
  } catch (error) {
    console.error("Error with notifications:", error);
    toast({
      title: isUpdate ? "Event Updated" : "Event Created",
      description: `${notificationData.eventName} has been ${isUpdate ? 'updated' : 'created'}, but email notifications failed to send.`,
      variant: "default",
    });
  }
};
