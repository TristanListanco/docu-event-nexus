
interface ConfirmationEmailData {
  staffName: string;
  staffRole: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer?: string;
  type: string;
  confirmationUrl: string;
  tokenExpiresAt: string;
}

export function generateConfirmationEmailTemplate(data: ConfirmationEmailData): { subject: string; html: string } {
  const eventDate = new Date(data.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const organizerSection = data.organizer 
    ? `<p><strong>Organizer:</strong> ${data.organizer}</p>`
    : '';

  // Calculate days until expiry
  const expiryDate = new Date(data.tokenExpiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const subject = `Event Assignment: ${data.eventName}`;
  
  const html = `
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
            ⏰ <strong>Important:</strong> This confirmation link will expire in ${daysUntilExpiry} days. Please respond as soon as possible to secure your assignment.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin: 10px 0;">
          <p style="font-size: 11px; color: #666; margin: 0;">
            <strong>Confirmation Link:</strong><br>
            <code style="word-break: break-all;">${data.confirmationUrl}</code>
          </p>
        </div>
      </div>
      
      <p>If you have any questions or conflicts, please contact the event organizer as soon as possible.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated notification from the CCS Event Management System.</p>
    </div>
  `;

  return { subject, html };
}
