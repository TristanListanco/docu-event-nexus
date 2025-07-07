
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { sendEmail } from './email-service.ts';
import { generateUpdateEmailTemplate, generateConfirmationEmailTemplate } from './email-templates.ts';
import { generateICSContent } from './calendar.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface EventNotificationRequest {
  eventId: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  type: string;
  assignedStaff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  isUpdate?: boolean;
  changes?: any;
  downloadOnly?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: EventNotificationRequest = await req.json();
    
    console.log("Processing event notification for:", requestData.eventName);
    console.log("Is update:", requestData.isUpdate);
    console.log("Download only:", requestData.downloadOnly);

    // If this is a download-only request, return ICS file
    if (requestData.downloadOnly) {
      const icsContent = generateICSContent({
        id: requestData.eventId,
        name: requestData.eventName,
        date: requestData.eventDate,
        start_time: requestData.startTime,
        end_time: requestData.endTime,
        location: requestData.location,
        organizer: requestData.organizer || 'N/A'
      }, 'Staff Member');

      return new Response(icsContent, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar",
          "Content-Disposition": `attachment; filename="${requestData.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
          ...corsHeaders,
        },
      });
    }

    let tokensGenerated = 0;

    // Process each staff member
    for (const staff of requestData.assignedStaff) {
      console.log(`Processing staff ${staff.id} for event ${requestData.eventId}`);
      
      // For updates, check existing assignment first
      if (requestData.isUpdate) {
        const { data: existingAssignment, error: fetchError } = await supabase
          .from('staff_assignments')
          .select('confirmation_status, confirmation_token, confirmation_token_expires_at')
          .eq('event_id', requestData.eventId)
          .eq('staff_id', staff.id)
          .single();

        if (fetchError) {
          console.log(`No existing assignment found for staff ${staff.id}, this might be an issue`);
          continue;
        }

        if (existingAssignment.confirmation_status === 'confirmed') {
          console.log(`Staff ${staff.id} already confirmed, skipping token generation`);
          continue;
        }

        if (existingAssignment.confirmation_status === 'declined') {
          console.log(`Staff ${staff.id} declined assignment, skipping notification`);
          continue;
        }

        const tokenExpiry = existingAssignment.confirmation_token_expires_at;
        const now = new Date();
        
        console.log(`Existing assignment found. Token expires at: ${tokenExpiry}, Current time: ${now.toISOString()}`);
        
        if (!existingAssignment.confirmation_token || (tokenExpiry && new Date(tokenExpiry) <= now)) {
          const confirmationToken = crypto.randomUUID();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);

          console.log(`Generating new token for staff ${staff.id}, expires: ${expiryDate.toISOString()}`);

          const { error: updateError } = await supabase
            .from('staff_assignments')
            .update({
              confirmation_token: confirmationToken,
              confirmation_token_expires_at: expiryDate.toISOString(),
              confirmation_status: 'pending',
              last_invitation_sent_at: new Date().toISOString()
            })
            .eq('event_id', requestData.eventId)
            .eq('staff_id', staff.id);

          if (updateError) {
            console.error(`Error updating token for staff ${staff.id}:`, updateError);
            continue;
          }

          console.log(`Successfully updated token for staff ${staff.id}`);
          tokensGenerated++;
        } else {
          console.log(`Token for staff ${staff.id} is still valid, not regenerating`);
        }
      } else {
        // For new events, always generate tokens
        const confirmationToken = crypto.randomUUID();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const { error: updateError } = await supabase
          .from('staff_assignments')
          .update({
            confirmation_token: confirmationToken,
            confirmation_token_expires_at: expiryDate.toISOString(),
            confirmation_status: 'pending',
            last_invitation_sent_at: new Date().toISOString()
          })
          .eq('event_id', requestData.eventId)
          .eq('staff_id', staff.id);

        if (updateError) {
          console.error(`Error updating token for staff ${staff.id}:`, updateError);
          continue;
        }

        tokensGenerated++;
      }
    }

    console.log(`Processed ${requestData.assignedStaff.length} staff members, tokens generated for: ${tokensGenerated}`);

    // Send emails to staff members
    let successCount = 0;
    let failureCount = 0;

    for (const staff of requestData.assignedStaff) {
      if (!staff.email) {
        console.log(`Skipping ${staff.name} - no email provided`);
        failureCount++;
        continue;
      }

      try {
        // Get the current assignment status and token
        const { data: assignment } = await supabase
          .from('staff_assignments')
          .select('confirmation_status, confirmation_token')
          .eq('event_id', requestData.eventId)
          .eq('staff_id', staff.id)
          .single();

        // Skip sending emails to confirmed staff for updates
        if (requestData.isUpdate && assignment?.confirmation_status === 'confirmed') {
          console.log(`Skipping email for ${staff.name} - already confirmed`);
          successCount++;
          continue;
        }

        // Skip sending emails to declined staff
        if (assignment?.confirmation_status === 'declined') {
          console.log(`Skipping email for ${staff.name} - declined assignment`);
          failureCount++;
          continue;
        }

        let emailTemplate: string;
        let emailSubject: string;

        if (requestData.isUpdate) {
          emailTemplate = generateUpdateEmailTemplate({
            staffName: staff.name,
            eventName: requestData.eventName,
            eventDate: requestData.eventDate,
            startTime: requestData.startTime,
            endTime: requestData.endTime,
            location: requestData.location,
            organizer: requestData.organizer || 'N/A',
            type: requestData.type,
            changes: requestData.changes || {}
          });
          emailSubject = `Event Updated: ${requestData.eventName}`;
        } else {
          const confirmationUrl = `${supabaseUrl.replace('/supabase', '')}/confirm-assignment?token=${assignment?.confirmation_token}`;
          
          emailTemplate = generateConfirmationEmailTemplate({
            staffName: staff.name,
            staffRole: staff.role,
            eventName: requestData.eventName,
            eventDate: requestData.eventDate,
            startTime: requestData.startTime,
            endTime: requestData.endTime,
            location: requestData.location,
            organizer: requestData.organizer || 'N/A',
            type: requestData.type,
            confirmationUrl: confirmationUrl
          });
          emailSubject = `Assignment Confirmation Required: ${requestData.eventName}`;
        }

        const emailResult = await sendEmail({
          to: staff.email,
          subject: emailSubject,
          html: emailTemplate,
          replyTo: 'noreply@yourdomain.com'
        });

        if (emailResult.success) {
          console.log(`Email sent to ${staff.email}: ${emailResult.messageId}`);
          console.log(`Email sent to ${staff.name} (${staff.email}):`, emailResult);
          successCount++;
        } else {
          console.error(`Failed to send email to ${staff.name}:`, emailResult.error);
          failureCount++;
        }
      } catch (error) {
        console.error(`Error processing email for ${staff.name}:`, error);
        failureCount++;
      }
    }

    console.log(`Email notifications sent: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        emailsSent: successCount,
        emailsFailed: failureCount,
        tokensGenerated: tokensGenerated
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-event-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
