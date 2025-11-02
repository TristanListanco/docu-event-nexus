export function generateCancellationEmailTemplate(data: {
  staffName: string;
  eventName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Event Cancelled</h2>
      
      <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #991b1b; margin-top: 0;">⚠️ Important Notice</h3>
        <p style="color: #991b1b; margin: 10px 0;">
          The event <strong>${data.eventName}</strong> has been cancelled.
        </p>
      </div>
      
      <p>Hi ${data.staffName},</p>
      <p>We regret to inform you that the event <strong>${data.eventName}</strong> has been cancelled.</p>
      
      <p>We apologize for any inconvenience this may cause. If you have any questions, please contact the event organizer.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated notification from the CCS Event Management System.</p>
    </div>
  `;
}
