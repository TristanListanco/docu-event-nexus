
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { NotificationRequest } from "./types.ts";
import { generateICSContent } from "./calendar.ts";
import { generateChangesHtml, generateEmailTemplate } from "./email-templates.ts";
import { sendEmailWithNodemailer } from "./email-service.ts";
import { getStaffWithTokens } from "./database.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notificationData: NotificationRequest = await req.json();
    
    console.log("Processing event notification for:", notificationData.eventName);
    console.log("Is update:", notificationData.isUpdate);
    console.log("Download only:", notificationData.downloadOnly);

    // If this is a download-only request, just return the ICS content
    if (notificationData.downloadOnly) {
      const icsContent = generateICSContent(notificationData);
      return new Response(
        JSON.stringify({ icsContent }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!notificationData.assignedStaff || notificationData.assignedStaff.length === 0) {
      return new Response(
        JSON.stringify({ message: "No staff assigned to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate ICS content
    const icsContent = generateICSContent(notificationData);

    // Format date for email display
    const eventDate = new Date(notificationData.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate changes HTML if this is an update
    const changesHtml = notificationData.isUpdate ? generateChangesHtml(notificationData.changes) : '';

    // Get confirmation tokens for each staff assignment
    const staffWithTokens = await getStaffWithTokens(notificationData.assignedStaff, notificationData.eventId);

    // Ensure we always use the production URL for confirmation links
    const baseUrl = "https://docu-event-scheduling.vercel.app";

    // Send emails to all assigned staff using Nodemailer
    const emailPromises = staffWithTokens.map(async (staff) => {
      if (!staff.email) {
        console.log(`Skipping ${staff.name} - no email provided`);
        return null;
      }

      const { subject, html } = generateEmailTemplate(
        staff,
        notificationData,
        eventDate,
        changesHtml,
        baseUrl
      );

      try {
        const emailResponse = await sendEmailWithNodemailer(
          staff.email,
          subject,
          html,
          notificationData.isUpdate ? icsContent : undefined
        );
        
        console.log(`Email sent to ${staff.name} (${staff.email}):`, emailResponse);
        return emailResponse;
      } catch (error) {
        console.error(`Failed to send email to ${staff.email}:`, error);
        throw error;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email notifications sent: ${successful} successful, ${failed} failed`);

    const message = notificationData.isUpdate 
      ? `Event update notifications sent successfully`
      : `Event assignment notifications sent successfully`;

    return new Response(
      JSON.stringify({ 
        message,
        stats: { successful, failed, total: notificationData.assignedStaff.length }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-event-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
