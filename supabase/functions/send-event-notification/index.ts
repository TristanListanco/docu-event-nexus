
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  eventId: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  assignedStaff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

// Function to generate .ics calendar file content
function generateICSContent(event: NotificationRequest): string {
  const startDateTime = new Date(`${event.eventDate}T${event.startTime}`);
  const endDateTime = new Date(`${event.eventDate}T${event.endTime}`);
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const startFormatted = formatDateForICS(startDateTime);
  const endFormatted = formatDateForICS(endDateTime);
  const now = formatDateForICS(new Date());
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Management System//Event Notification//EN
BEGIN:VEVENT
UID:${event.eventId}@admin-ccsdocu.com
DTSTAMP:${now}
DTSTART:${startFormatted}
DTEND:${endFormatted}
SUMMARY:${event.eventName}
DESCRIPTION:You have been assigned to this ${event.type} event as part of the team.
LOCATION:${event.location}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Event reminder: ${event.eventName}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const notificationData: NotificationRequest = await req.json();
    
    console.log("Processing event notification for:", notificationData.eventName);
    console.log("Assigned staff:", notificationData.assignedStaff);

    if (!notificationData.assignedStaff || notificationData.assignedStaff.length === 0) {
      return new Response(
        JSON.stringify({ message: "No staff assigned to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate ICS content
    const icsContent = generateICSContent(notificationData);
    const icsBase64 = btoa(icsContent);

    // Format date for email display
    const eventDate = new Date(notificationData.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send emails to all assigned staff
    const emailPromises = notificationData.assignedStaff.map(async (staff) => {
      if (!staff.email) {
        console.log(`Skipping ${staff.name} - no email provided`);
        return null;
      }

      const emailResponse = await resend.emails.send({
        from: "CCS Event Management <noreply@admin-ccsdocu.com>",
        to: [staff.email],
        subject: `Event Assignment: ${notificationData.eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You've Been Assigned to an Event!</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2563eb; margin-top: 0;">Event Details</h3>
              <p><strong>Event:</strong> ${notificationData.eventName}</p>
              <p><strong>Type:</strong> ${notificationData.type}</p>
              <p><strong>Role:</strong> ${staff.role}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${notificationData.startTime} - ${notificationData.endTime}</p>
              <p><strong>Location:</strong> ${notificationData.location}</p>
            </div>
            
            <p>Hi ${staff.name},</p>
            <p>You have been assigned as the <strong>${staff.role}</strong> for the upcoming event: <strong>${notificationData.eventName}</strong>.</p>
            <p>Please add this event to your calendar using the attached .ics file, and make sure you're available at the scheduled time.</p>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📅 Calendar File Attached</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Open the attached .ics file to add this event directly to your calendar.</p>
            </div>
            
            <p>If you have any questions or conflicts, please contact the event organizer as soon as possible.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from the CCS Event Management System.</p>
          </div>
        `,
        attachments: [
          {
            filename: `${notificationData.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
            content: icsBase64,
            content_type: 'text/calendar',
          }
        ]
      });

      console.log(`Email sent to ${staff.name} (${staff.email}):`, emailResponse);
      return emailResponse;
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Email notifications sent successfully`,
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
