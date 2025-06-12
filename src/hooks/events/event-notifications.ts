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

        // Create assignments with proper error handling - use insert instead of upsert
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

        // Wait for all assignments to be created first
        await Promise.all(assignmentPromises);
        console.log("All assignments created successfully");

        // Add a small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send confirmation emails with retry logic
        console.log("Sending confirmation emails...");
        const emailPromises = staffData.map(async (staff) => {
          if (!staff.email) {
            console.log(`Skipping ${staff.name} - no email provided`);
            return { success: false, staff: staff.name, reason: "No email provided" };
          }

          const staffRole = videographerIds.includes(staff.id) ? "Videographer" : "Photographer";
          
          // Retry logic for email sending
          let attempts = 0;
          const maxAttempts = 3;
          
          while (attempts < maxAttempts) {
            try {
              console.log(`Sending email to ${staff.name} (attempt ${attempts + 1})`);
              
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
                console.error(`Email error for ${staff.name} (attempt ${attempts + 1}):`, emailError);
                attempts++;
                if (attempts < maxAttempts) {
                  // Wait before retry
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                  continue;
                }
                return { success: false, staff: staff.name, error: emailError };
              } else {
                console.log(`Confirmation email sent to ${staff.name}:`, data);
                return { success: true, staff: staff.name };
              }
            } catch (error) {
              console.error(`Failed to send confirmation email to ${staff.name} (attempt ${attempts + 1}):`, error);
              attempts++;
              if (attempts < maxAttempts) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                continue;
              }
              return { success: false, staff: staff.name, error };
            }
          }
          
          return { success: false, staff: staff.name, error: "Max retries exceeded" };
        });

        // Wait for all emails to be sent
        const emailResults = await Promise.all(emailPromises);
        const successCount = emailResults.filter(result => result.success).length;
        const failureCount = emailResults.filter(result => !result.success).length;

        console.log("Email results:", emailResults);

        if (successCount === staffData.length) {
          console.log(`All ${successCount} confirmation emails sent successfully`);
          toast({
            title: "Success",
            description: `Event created and ${successCount} email notifications sent successfully.`,
          });
        } else if (successCount > 0) {
          console.log(`${successCount} emails sent successfully, ${failureCount} failed`);
          const failedStaff = emailResults
            .filter(result => !result.success)
            .map(result => result.staff)
            .join(", ");
          
          toast({
            title: "Partial Success",
            description: `Event created. ${successCount} emails sent successfully. Failed to send to: ${failedStaff}`,
            variant: "default",
          });
        } else {
          console.error("All email notifications failed to send");
          const allErrors = emailResults.map(result => 
            `${result.staff}: ${result.reason || 'Unknown error'}`
          ).join("; ");
          
          toast({
            title: "Email Sending Failed",
            description: `Event created but failed to send email notifications. Errors: ${allErrors}`,
            variant: "destructive",
          });
        }

      } else {
        // For updates, do not send emails
        console.log("Skipping email notifications for updated event");

        toast({
          title: "Event Updated",
          description: `${notificationData.eventName} has been updated. Email notifications were not sent.`,
        });
      }
    }
  } catch (error) {
    console.error("Error with notifications:", error);
    toast({
      title: isUpdate ? "Event Updated" : "Event Created",
      description: `${notificationData.eventName} has been ${isUpdate ? 'updated' : 'created'}, but email notifications failed to send. Error: ${error.message}`,
      variant: "destructive",
    });
  }
};
