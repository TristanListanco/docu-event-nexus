
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
      // For new assignments, create staff assignments first
      if (!isUpdate) {
        console.log("Creating staff assignments for new event...");
        
        // Show immediate success feedback
        toast({
          title: "Event Created",
          description: `${notificationData.eventName} has been created successfully. Email notifications are being sent.`,
        });

        // Create assignments with proper error handling
        const assignmentPromises = staffData.map(async (staff) => {
          const confirmationToken = uuidv4();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now

          const { error: assignmentError } = await supabase
            .from("staff_assignments")
            .upsert({
              user_id: user.id,
              event_id: notificationData.eventId,
              staff_id: staff.id,
              confirmation_token: confirmationToken,
              confirmation_token_expires_at: expiryDate.toISOString(),
              confirmation_status: 'pending'
            }, {
              onConflict: 'event_id,staff_id'
            });

          if (assignmentError) {
            console.error("Error creating assignment:", assignmentError);
            throw assignmentError;
          }
          
          console.log(`Assignment created for staff ${staff.name}`);
          return staff;
        });

        // Wait for all assignments to be created first
        await Promise.all(assignmentPromises);
        console.log("All assignments created successfully");

        // Send confirmation emails
        console.log("Sending confirmation emails...");
        const emailPromises = staffData.map(async (staff) => {
          if (!staff.email) {
            console.log(`Skipping ${staff.name} - no email provided`);
            return { success: false, staff: staff.name, reason: "No email provided" };
          }

          const staffRole = videographerIds.includes(staff.id) ? "Videographer" : "Photographer";
          
          try {
            const { data, error: emailError } = await supabase.functions.invoke('confirmation-email', {
              body: {
                eventId: notificationData.eventId,
                staffId: staff.id,
                staffName: staff.name,
                staffEmail: staff.email,
                staffRole: staffRole,
                eventName: notificationData.eventName,
                eventDate: notificationData.eventDate,
                startTime: notificationData.startTime,
                endTime: notificationData.endTime,
                location: notificationData.location,
                organizer: notificationData.organizer,
                type: notificationData.type
              }
            });

            if (emailError) {
              console.error(`Error sending confirmation email to ${staff.name}:`, emailError);
              return { success: false, staff: staff.name, error: emailError };
            } else {
              console.log(`Confirmation email sent to ${staff.name}:`, data);
              return { success: true, staff: staff.name };
            }
          } catch (error) {
            console.error(`Failed to send confirmation email to ${staff.name}:`, error);
            return { success: false, staff: staff.name, error };
          }
        });

        // Wait for all emails to be sent
        const emailResults = await Promise.all(emailPromises);
        const successCount = emailResults.filter(result => result.success).length;
        const failureCount = emailResults.filter(result => !result.success).length;

        if (successCount === staffData.length) {
          console.log(`All ${successCount} confirmation emails sent successfully`);
          toast({
            title: "Success",
            description: `Event created and ${successCount} email notifications sent successfully.`,
          });
        } else if (successCount > 0) {
          console.log(`${successCount} emails sent successfully, ${failureCount} failed`);
          toast({
            title: "Partial Success",
            description: `Event created. ${successCount} emails sent, ${failureCount} failed to send.`,
            variant: "default",
          });
        } else {
          console.error("All email notifications failed to send");
          toast({
            title: "Email Sending Failed",
            description: "Event created but failed to send email notifications to staff members.",
            variant: "destructive",
          });
        }

      } else {
        // For updates, use the existing notification function
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
          console.error("Error sending update notifications:", notificationError);
        }

        toast({
          title: "Event Updated",
          description: `${notificationData.eventName} has been updated and email notifications sent to assigned staff.`,
        });
      }
    }
  } catch (error) {
    console.error("Error with notifications:", error);
    toast({
      title: isUpdate ? "Event Updated" : "Event Created",
      description: `${notificationData.eventName} has been ${isUpdate ? 'updated' : 'created'}, but email notifications failed to send.`,
      variant: "destructive",
    });
  }
};
