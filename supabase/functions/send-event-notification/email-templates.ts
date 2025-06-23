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

export function generateUpdateEmailTemplate(data: {
  staffName: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  type: string;
  changes: any;
}): string {
  const eventDate = new Date(data.eventDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const changesHtml = generateChangesHtml(data.changes);
  const organizerSection = data.organizer 
    ? `<p><strong>Organizer:</strong> ${data.organizer}</p>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Event Updated!</h2>
      
      ${changesHtml}
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2563eb; margin-top: 0;">Updated Event Details</h3>
        <p><strong>Event:</strong> ${data.eventName}</p>
        <p><strong>Type:</strong> ${data.type}</p>
        ${organizerSection}
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Time:</strong> ${data.startTime} - ${data.endTime} (Philippine Standard Time)</p>
        <p><strong>Location:</strong> ${data.location}</p>
      </div>
      
      <p>Hi ${data.staffName},</p>
      <p>The event <strong>${data.eventName}</strong> has been updated. Please review the changes above and update your calendar accordingly.</p>
      
      <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>📅 Updated Calendar File Attached</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Open the attached .ics file to update this event in your calendar. The calendar entry includes automatic reminders 6 hours and 1 hour before the event (Philippine Standard Time).</p>
      </div>
      
      <p>If you have any questions or conflicts, please contact the event organizer as soon as possible.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated notification from the CCS Event Management System.</p>
    </div>
  `;
}

export function generateConfirmationEmailTemplate(data: {
  staffName: string;
  staffRole: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  type: string;
  confirmationUrl: string;
}): string {
  const eventDate = new Date(data.eventDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const organizerSection = data.organizer 
    ? `<p><strong>Organizer:</strong> ${data.organizer}</p>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You've Been Assigned to an Event!</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2563eb; margin-top: 0;">Event Details</h3>
        <p><strong>Event:</strong> ${data.eventName}</p>
        <p><strong>Type:</strong> ${data.type}</p>
        ${organizerSection}
        <p><strong>Role:</strong> ${data.staffRole}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Time:</strong> ${data.startTime} - ${data.endTime} (Philippine Standard Time)</p>
        <p><strong>Location:</strong> ${data.location}</p>
      </div>
      
      <p>Hi ${data.staffName},</p>
      <p>You have been assigned as the <strong>${data.staffRole}</strong> for the upcoming event: <strong>${data.eventName}</strong>.</p>
      
      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #2563eb; margin-top: 0;">📋 Please Confirm Your Assignment</h3>
        <p style="margin: 10px 0;">Click the button below to confirm or decline this assignment:</p>
        <a href="${data.confirmationUrl}" 
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
      </div>
      
      <p>If you have any questions or conflicts, please contact the event organizer as soon as possible.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated notification from the CCS Event Management System.</p>
    </div>
  `;
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

export const generateEventUpdateEmailHtml = (eventData: any, staffName: string, changes?: any): string => {
  const changeDetails = changes ? Object.entries(changes).map(([key, change]: [string, any]) => {
    const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    return `<li><strong>${fieldName}:</strong> ${change.old} → ${change.new}</li>`;
  }).join('') : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Updated</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .changes { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .changes ul { margin: 0; padding-left: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 Event Updated</h1>
      </div>
      <div class="content">
        <p>Hello ${staffName},</p>
        <p>An event you're assigned to has been updated. Here are the current details:</p>
        
        <div class="event-details">
          <h3>📋 Event Details</h3>
          <p><strong>Event:</strong> ${eventData.eventName}</p>
          <p><strong>Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Time:</strong> ${eventData.startTime} - ${eventData.endTime}</p>
          <p><strong>Location:</strong> ${eventData.location}</p>
          ${eventData.organizer ? `<p><strong>Organizer:</strong> ${eventData.organizer}</p>` : ''}
          <p><strong>Type:</strong> ${eventData.type}</p>
        </div>

        ${changeDetails ? `
        <div class="changes">
          <h3>🔄 What Changed</h3>
          <ul>${changeDetails}</ul>
        </div>
        ` : ''}
        
        <p>Please make note of these updates and ensure your availability for the event.</p>
        <p>If you have any questions or concerns about these changes, please contact the event organizer.</p>
      </div>
      <div class="footer">
        <p>This is an automated notification from the Event Management System.</p>
      </div>
    </body>
    </html>
  `;
};

export const generateEventNotificationEmailHtml = (eventData: any, staffName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Assignment</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .confirmation-section { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; border-radius: 6px; text-decoration: none; font-weight: bold; text-align: center; }
        .btn-confirm { background-color: #28a745; color: white; }
        .btn-decline { background-color: #dc3545; color: white; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 Event Assignment</h1>
      </div>
      <div class="content">
        <p>Hello ${staffName},</p>
        <p>You have been assigned to work on an upcoming event. Please review the details below:</p>
        
        <div class="event-details">
          <h3>📋 Event Details</h3>
          <p><strong>Event:</strong> ${eventData.eventName}</p>
          <p><strong>Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Time:</strong> ${eventData.startTime} - ${eventData.endTime}</p>
          <p><strong>Location:</strong> ${eventData.location}</p>
          ${eventData.organizer ? `<p><strong>Organizer:</strong> ${eventData.organizer}</p>` : ''}
          <p><strong>Type:</strong> ${eventData.type}</p>
        </div>
        
        <div class="confirmation-section">
          <h3>⚡ Action Required</h3>
          <p>Please confirm your availability for this event by clicking one of the buttons below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="CONFIRMATION_LINK" class="button btn-confirm">✅ Confirm Attendance</a>
            <a href="DECLINE_LINK" class="button btn-decline">❌ Cannot Attend</a>
          </div>
          <p><em>Note: Your response helps us plan better for the event. Please respond as soon as possible.</em></p>
        </div>
        
        <p>Thank you for your dedication to our events!</p>
      </div>
      <div class="footer">
        <p>This is an automated notification from the Event Management System.</p>
      </div>
    </body>
    </html>
  `;
};

export const generateEventReminderEmailHtml = (eventData: any, staffName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff7e5f; }
        .reminder-section { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⏰ Event Reminder</h1>
      </div>
      <div class="content">
        <p>Hello ${staffName},</p>
        <p>This is a friendly reminder about your upcoming event assignment:</p>
        
        <div class="event-details">
          <h3>📋 Event Details</h3>
          <p><strong>Event:</strong> ${eventData.eventName}</p>
          <p><strong>Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Time:</strong> ${eventData.startTime} - ${eventData.endTime}</p>
          <p><strong>Location:</strong> ${eventData.location}</p>
          ${eventData.organizer ? `<p><strong>Organizer:</strong> ${eventData.organizer}</p>` : ''}
          <p><strong>Type:</strong> ${eventData.type}</p>
        </div>
        
        <div class="reminder-section">
          <h3>📝 Important Notes</h3>
          <ul>
            <li>Please arrive 15 minutes before the scheduled time</li>
            <li>Bring all necessary equipment and materials</li>
            <li>Contact the organizer if you have any last-minute issues</li>
            <li>Check the weather and dress appropriately</li>
          </ul>
        </div>
        
        <p>We appreciate your commitment and look forward to a successful event!</p>
      </div>
      <div class="footer">
        <p>This is an automated reminder from the Event Management System.</p>
      </div>
    </body>
    </html>
  `;
};
