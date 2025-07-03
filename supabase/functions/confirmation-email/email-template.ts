
export const generateEmailTemplate = (data: {
  staffName: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  role: string;
  confirmUrl: string;
  declineUrl: string;
}) => {
  const formattedDate = new Date(data.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You've Been Assigned to an Event!</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2563eb; margin-top: 0;">Event Details</h3>
        <p><strong>Event:</strong> ${data.eventName}</p>
        <p><strong>Role:</strong> ${data.role}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${data.startTime} - ${data.endTime} (Philippine Standard Time)</p>
        <p><strong>Location:</strong> ${data.location}</p>
        ${data.organizer ? `<p><strong>Organizer:</strong> ${data.organizer}</p>` : ''}
      </div>
      
      <p>Hi ${data.staffName},</p>
      <p>You have been assigned as the <strong>${data.role}</strong> for the upcoming event: <strong>${data.eventName}</strong>.</p>
      
      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #2563eb; margin-top: 0;">📋 Please Confirm Your Assignment</h3>
        <p style="margin: 10px 0;">Click the button below to view assignment details and confirm or decline:</p>
        
        <div style="margin: 20px 0;">
          <a href="${data.confirmUrl}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            📋 View Assignment Details
          </a>
        </div>
        
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
};
