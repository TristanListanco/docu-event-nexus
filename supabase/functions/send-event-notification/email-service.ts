
import { createTransporter } from "npm:nodemailer@6.9.8";

export async function sendEmailWithNodemailer(to: string, subject: string, html: string, icsContent?: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail credentials not configured");
  }

  const transporter = createTransporter({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  const mailOptions: any = {
    from: `"CCS Event Management" <${gmailUser}>`,
    to: to,
    subject: subject,
    html: html,
  };

  if (icsContent) {
    mailOptions.attachments = [
      {
        filename: 'event.ics',
        content: icsContent,
        contentType: 'text/calendar',
      },
    ];
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}:`, info.messageId);
  
  return {
    success: true,
    messageId: info.messageId,
    response: info.response,
  };
}
