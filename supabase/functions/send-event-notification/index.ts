import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.8";

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
  organizer?: string;
  type: string;
  assignedStaff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  isUpdate?: boolean;
  changes?: {
    name?: { old: string; new: string };
    date?: { old: string; new: string };
    startTime?: { old: string; new: string };
    endTime?: { old: string; new: string };
    location?: { old: string; new: string };
    organizer?: { old: string; new: string };
    type?: { old: string; new: string };
  };
}

// Function to generate .ics calendar file content with Philippine Standard Time (UTC+8)
function generateICSContent(event: NotificationRequest): string {
  // Parse the date and times correctly for Philippine timezone
  const eventDateStr = event.eventDate; // Format: YYYY-MM-DD
  const startTimeStr = event.startTime; // Format: HH:MM (24-hour)
  const endTimeStr = event.endTime; // Format: HH:MM (24-hour)
  
  // Create date strings in the format the ICS expects (local time in Manila timezone)
  const startDateTime = `${eventDateStr}T${startTimeStr}:00`;
  const endDateTime = `${eventDateStr}T${endTimeStr}:00`;
  
  // Format for ICS in local time (YYYYMMDDTHHMMSS)
  const formatDateForICS = (dateTimeStr: string) => {
    return dateTimeStr.replace(/[-:]/g, '').replace('T', 'T');
  };
  
  const startFormatted = formatDateForICS(startDateTime);
  const endFormatted = formatDateForICS(endDateTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // For alarms, we need to calculate the trigger times
  // 6 hours before start time
  const startDateTimeObj = new Date(`${eventDateStr}T${startTimeStr}:00+08:00`);
  const alarm6Hours = new Date(startDateTimeObj.getTime() - (6 * 60 * 60 * 1000));
  const alarm1Hour = new Date(startDateTimeObj.getTime() - (1 * 60 * 60 * 1000));
  
  const organizerInfo = event.organizer ? `\\nOrganizer: ${event.organizer}` : '';
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Management System//Event Notification//EN
BEGIN:VTIMEZONE
TZID:Asia/Manila
BEGIN:STANDARD
DTSTART:19701101T000000
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:PST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${event.eventId}@admin-ccsdocu.com
DTSTAMP:${now}
DTSTART;TZID=Asia/Manila:${startFormatted}
DTEND;TZID=Asia/Manila:${endFormatted}
SUMMARY:${event.eventName}
DESCRIPTION:${event.isUpdate ? 'Event details have been updated.' : 'You have been assigned to this event.'} Event: ${event.eventName}${organizerInfo}
LOCATION:${event.location}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT360M
ACTION:DISPLAY
DESCRIPTION:Event reminder (6 hours): ${event.eventName}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Event reminder (1 hour): ${event.eventName}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

// Function to generate changes summary HTML
function generateChangesHtml(changes: any): string {
  if (!changes) return '';
  
  let changesHtml = '<div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;"><h4 style="color: #856404; margin-top: 0;">📝 What Changed:</h4><ul style="margin: 10px 0 0 20px; color: #856404;">';
  
  if (changes.name) {
    changesHtml += `<li><strong>Event Name:</strong> "${changes.name.old}" → "${changes.name.new}"</li>`;
  }
  if (changes.date) {
    const oldDate = new Date(changes.date.old).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const newDate = new Date(changes.date.new).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    changesHtml += `<li><strong>Date:</strong> ${oldDate} → ${newDate}</li>`;
  }
  if (changes.startTime) {
    changesHtml += `<li><strong>Start Time:</strong> ${changes.startTime.old} → ${changes.startTime.new}</li>`;
  }
  if (changes.endTime) {
    changesHtml += `<li><strong>End Time:</strong> ${changes.endTime.old} → ${changes.endTime.new}</li>`;
  }
  if (changes.location) {
    changesHtml += `<li><strong>Location:</strong> "${changes.location.old}" → "${changes.location.new}"</li>`;
  }
  if (changes.organizer) {
    changesHtml += `<li><strong>Organizer:</strong> "${changes.organizer.old}" → "${changes.organizer.new}"</li>`;
  }
  if (changes.type) {
    changesHtml += `<li><strong>Event Type:</strong> ${changes.type.old} → ${changes.type.new}</li>`;
  }
  
  changesHtml += '</ul></div>';
  return changesHtml;
}

// Function to send email using Nodemailer with Gmail
async function sendEmailWithNodemailer(to: string, subject: string, html: string, icsContent?: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail credentials not configured");
  }

  // Create transporter using Nodemailer - FIXED: changed createTransporter to createTransport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  // Prepare email options
  const mailOptions: any = {
    from: `"CCS Event Management" <${gmailUser}>`,
    to: to,
    subject: subject,
    html: html,
  };

  // Add ICS attachment if provided
  if (icsContent) {
    mailOptions.attachments = [
      {
        filename: 'event.ics',
        content: icsContent,
        contentType: 'text/calendar',
      },
    ];
  }

  // Send email
  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}:`, info.messageId);
  
  return {
    success: true,
    messageId: info.messageId,
    response: info.response,
  };
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
    console.log("Is update:", notificationData.isUpdate);
    console.log("Changes:", notificationData.changes);
    console.log("Assigned staff:", notificationData.assignedStaff);

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

    // Send emails to all assigned staff using Nodemailer
    const emailPromises = notificationData.assignedStaff.map(async (staff) => {
      if (!staff.email) {
        console.log(`Skipping ${staff.name} - no email provided`);
        return null;
      }

      const isUpdate = notificationData.isUpdate;
      const emailTitle = isUpdate ? 'Event Updated!' : "You've Been Assigned to an Event!";
      const emailSubject = isUpdate ? `Event Update: ${notificationData.eventName}` : `Event Assignment: ${notificationData.eventName}`;
      
      const organizerSection = notificationData.organizer 
        ? `<p><strong>Organizer:</strong> ${notificationData.organizer}</p>`
        : '';
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${emailTitle}</h2>
          
          ${changesHtml}
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">${isUpdate ? 'Updated Event Details' : 'Event Details'}</h3>
            <p><strong>Event:</strong> ${notificationData.eventName}</p>
            <p><strong>Type:</strong> ${notificationData.type}</p>
            ${organizerSection}
            <p><strong>Role:</strong> ${staff.role}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${notificationData.startTime} - ${notificationData.endTime} (Philippine Standard Time)</p>
            <p><strong>Location:</strong> ${notificationData.location}</p>
          </div>
          
          <p>Hi ${staff.name},</p>
          ${isUpdate 
            ? `<p>The event <strong>${notificationData.eventName}</strong> has been updated. Please review the changes above and update your calendar accordingly.</p>`
            : `<p>You have been assigned as the <strong>${staff.role}</strong> for the upcoming event: <strong>${notificationData.eventName}</strong>.</p>`
          }
          <p>Please add this ${isUpdate ? 'updated ' : ''}event to your calendar using the attached .ics file, and make sure you're available at the scheduled time.</p>
          
          <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📅 Calendar File Attached</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Open the attached .ics file to ${isUpdate ? 'update this event in' : 'add this event to'} your calendar. The calendar entry includes automatic reminders 6 hours and 1 hour before the event (Philippine Standard Time).</p>
          </div>
          
          <p>If you have any questions or conflicts, please contact the event organizer as soon as possible.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated notification from the CCS Event Management System.</p>
        </div>
      `;

      try {
        const emailResponse = await sendEmailWithNodemailer(
          staff.email,
          emailSubject,
          emailHtml,
          icsContent
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
