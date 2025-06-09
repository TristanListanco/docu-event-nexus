
import { NotificationRequest } from "./types.ts";

export function generateChangesHtml(changes: any): string {
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

export function generateEmailTemplate(
  staff: { name: string; role: string; confirmationToken: string | null },
  notificationData: NotificationRequest,
  eventDate: string,
  changesHtml: string,
  baseUrl: string
): { subject: string; html: string } {
  const isUpdate = notificationData.isUpdate;
  const emailTitle = isUpdate ? 'Event Updated!' : "You've Been Assigned to an Event!";
  const emailSubject = isUpdate ? `Event Update: ${notificationData.eventName}` : `Event Assignment: ${notificationData.eventName}`;
  
  const organizerSection = notificationData.organizer 
    ? `<p><strong>Organizer:</strong> ${notificationData.organizer}</p>`
    : '';

  // Always use the production URL for confirmation links
  const productionUrl = "https://docu-event-scheduling.vercel.app";
  
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
      
      ${staff.confirmationToken && !isUpdate ? `
      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #2563eb; margin-top: 0;">📋 Please Confirm Your Assignment</h3>
        <p style="margin: 10px 0;">Click the button below to confirm or decline this assignment:</p>
        <a href="${productionUrl}/confirm/${staff.confirmationToken}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px;">
          Confirm Assignment
        </a>
        <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
          Once confirmed, you'll be able to download the calendar file to add this event to your calendar.
        </p>
        <div style="background: #fff3cd; padding: 10px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #ffc107;">
          <p style="font-size: 12px; color: #856404; margin: 0;">
            ⏰ <strong>Important:</strong> This confirmation link will expire in 7 days. Please respond as soon as possible to secure your assignment.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin: 10px 0;">
          <p style="font-size: 11px; color: #666; margin: 0;">
            <strong>Confirmation Link:</strong><br>
            <code style="word-break: break-all;">${productionUrl}/confirm/${staff.confirmationToken}</code>
          </p>
        </div>
      </div>
      ` : ''}
      
      ${isUpdate ? `
      <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>📅 Updated Calendar File Attached</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Open the attached .ics file to update this event in your calendar. The calendar entry includes automatic reminders 6 hours and 1 hour before the event (Philippine Standard Time).</p>
      </div>
      ` : ''}
      
      <p>If you have any questions or conflicts, please contact the event organizer as soon as possible.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated notification from the CCS Event Management System.</p>
    </div>
  `;

  return { subject: emailSubject, html: emailHtml };
}
