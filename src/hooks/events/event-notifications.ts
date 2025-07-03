
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

// New function to send cancellation emails
export const sendCancellationNotifications = async (
  eventId: string,
  eventName: string,
  assignedStaffIds: string[]
) => {
  if (assignedStaffIds.length === 0) {
    return;
  }

  try {
    const { data: staffData, error: staffError } = await supabase
      .from("staff_members")
      .select("id, name, email")
      .in("id", assignedStaffIds);

    if (staffError) {
      console.error("Error fetching staff for cancellation notifications:", staffError);
      throw staffError;
    }

    if (staffData && staffData.length > 0) {
      // Send cancellation notifications using a simple approach
      const emailPromises = staffData.map(async (staff) => {
        if (!staff.email) {
          console.log(`Skipping ${staff.name} - no email provided`);
          return { success: false, staff: staff.name, reason: "No email provided" };
        }

        try {
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
              assignedStaff: [{
                id: staff.id,
                name: staff.name,
                email: staff.email,
                role: "Staff"
              }],
              isCancellation: true
            }
          });

          if (emailError) {
            console.error(`Cancellation email error for ${staff.name}:`, emailError);
            return { success: false, staff: staff.name, error: emailError };
          } else {
            console.log(`Cancellation email sent to ${staff.name}:`, data);
            return { success: true, staff: staff.name };
          }
        } catch (error) {
          console.error(`Failed to send cancellation email to ${staff.name}:`, error);
          return { success: false, staff: staff.name, error };
        }
      });

      const emailResults = await Promise.all(emailPromises);
      const successCount = emailResults.filter(result => result.success).length;
      const failureCount = emailResults.filter(result => !result.success).length;

      if (successCount > 0) {
        toast({
          title: "Cancellation Notifications Sent",
          description: `${successCount} cancellation emails sent successfully.${failureCount > 0 ? ` ${failureCount} failed to send.` : ''}`,
        });
      } else if (failureCount > 0) {
        toast({
          title: "Email Sending Failed",
          description: "Failed to send cancellation notifications.",
          variant: "destructive",
        });
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
