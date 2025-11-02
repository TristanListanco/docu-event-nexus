
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

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
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data: staffData, error: staffError } = await supabase
      .from("staff_members")
      .select("id, name, email")
      .in("id", assignedStaffIds);

    if (staffError) {
      console.error("Error fetching staff for notifications:", staffError);
      throw staffError;
    }

    if (staffData && staffData.length > 0) {
      if (isUpdate) {
        // For updates, send update emails using the send-event-notification function
        console.log("Sending update notifications...");
        
        // Show immediate feedback
        toast({
          title: "Event Updated",
          description: `${notificationData.eventName} has been updated. Sending email notifications...`,
        });

        // Prepare staff data with roles for the notification function
        const staffWithRoles = staffData.map(staff => ({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: videographerIds.includes(staff.id) ? "Videographer" : "Photographer"
        }));

        // Send update notifications using the send-event-notification function
        const { data: notificationResponse, error: notificationError } = await supabase.functions.invoke('send-event-notification', {
          body: {
            eventId: notificationData.eventId,
            eventName: notificationData.eventName,
            eventDate: notificationData.eventDate,
            startTime: notificationData.startTime,
            endTime: notificationData.endTime,
            location: notificationData.location,
            organizer: notificationData.organizer,
            type: notificationData.type,
            assignedStaff: staffWithRoles,
            isUpdate: true,
            changes: notificationData.changes
          }
        });

        if (notificationError) {
          console.error("Error sending update notifications:", notificationError);
          toast({
            title: "Event Updated",
            description: `${notificationData.eventName} has been updated, but failed to send email notifications. Error: ${notificationError.message}`,
            variant: "destructive",
          });
        } else {
          console.log("Update notifications sent successfully:", notificationResponse);
          toast({
            title: "Event Updated",
            description: `${notificationData.eventName} has been updated and email notifications sent successfully.`,
          });
        }

      } else {
        // For new assignments, create staff assignments first
        console.log("Creating staff assignments for new event...");
        
        // Show immediate success feedback - no automatic email sending
        toast({
          title: "Event Created",
          description: `${notificationData.eventName} has been created successfully. You can manually send invitations from the event details page.`,
        });

        // Create assignments without automatic email sending
        const assignmentPromises = staffData.map(async (staff) => {
          const confirmationToken = uuidv4();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now

          const { error: assignmentError } = await supabase
            .from("staff_assignments")
            .insert({
              user_id: user.id,
              event_id: notificationData.eventId,
              staff_id: staff.id,
              confirmation_token: confirmationToken,
              confirmation_token_expires_at: expiryDate.toISOString(),
              confirmation_status: 'pending'
            });

          if (assignmentError) {
            console.error("Error creating assignment:", assignmentError);
            throw assignmentError;
          }
          
          console.log(`Assignment created for staff ${staff.name}`);
          return staff;
        });

        // Wait for all assignments to be created
        await Promise.all(assignmentPromises);
        console.log("All assignments created successfully");
      }
    }
  } catch (error) {
    console.error("Error with notifications:", error);
    toast({
      title: isUpdate ? "Event Updated" : "Event Created",
      description: `${notificationData.eventName} has been ${isUpdate ? 'updated' : 'created'}, but there was an issue with the assignments. Error: ${error.message}`,
      variant: "destructive",
    });
  }
};

// New function to send cancellation emails to confirmed staff only
export const sendCancellationNotifications = async (
  eventId: string,
  eventName: string,
  assignedStaffIds: string[]
) => {
  if (assignedStaffIds.length === 0) {
    return;
  }

  try {
    // First, get only the confirmed staff assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("staff_assignments")
      .select("staff_id")
      .eq("event_id", eventId)
      .eq("confirmation_status", "confirmed");

    if (assignmentsError) {
      console.error("Error fetching confirmed assignments:", assignmentsError);
      throw assignmentsError;
    }

    const confirmedStaffIds = assignments?.map(a => a.staff_id) || [];
    
    if (confirmedStaffIds.length === 0) {
      console.log("No confirmed staff to notify for cancellation");
      return;
    }

    // Get staff details for confirmed staff only
    const { data: staffData, error: staffError } = await supabase
      .from("staff_members")
      .select("id, name, email")
      .in("id", confirmedStaffIds);

    if (staffError) {
      console.error("Error fetching staff for cancellation notifications:", staffError);
      throw staffError;
    }

    if (staffData && staffData.length > 0) {
      // Prepare staff data for the notification function
      const staffWithRoles = staffData.map(staff => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: "Staff"
      }));

      // Send cancellation notifications using the send-event-notification function
      const { data, error: emailError } = await supabase.functions.invoke('send-event-notification', {
        body: {
          eventId: eventId,
          eventName: eventName,
          eventDate: new Date().toISOString().split('T')[0],
          startTime: "00:00",
          endTime: "00:00",
          location: "N/A",
          organizer: "System",
          type: "General",
          assignedStaff: staffWithRoles,
          isCancellation: true
        }
      });

      if (emailError) {
        console.error("Cancellation email error:", emailError);
        toast({
          title: "Partial Success",
          description: `Event cancelled, but failed to send some cancellation notifications.`,
          variant: "destructive",
        });
      } else {
        console.log(`Cancellation emails sent successfully:`, data);
      }
    }
  } catch (error) {
    console.error("Error sending cancellation notifications:", error);
    toast({
      title: "Error",
      description: "Failed to send cancellation notifications.",
      variant: "destructive",
    });
  }
};
