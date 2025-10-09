
import nodemailer from "npm:nodemailer@6.9.8";

// Global transporter for connection reuse
let globalTransporter: any = null;

const createTransporter = () => {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail credentials not configured");
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
    // Optimized settings for faster delivery
    pool: true, // Use connection pooling
    maxConnections: 5, // Increase concurrent connections
    maxMessages: 100, // Send up to 100 messages per connection
    rateLimit: 14, // Send up to 14 messages per second
  });
};

export async function sendEmailWithNodemailer(to: string, subject: string, html: string) {
  try {
    // Reuse global transporter or create new one
    if (!globalTransporter) {
      console.log("Creating new optimized email transporter...");
      globalTransporter = createTransporter();
    }

    const mailOptions = {
      from: `"CCS Event Management" <${Deno.env.get("GMAIL_USER")}>`,
      to: to,
      subject: subject,
      html: html,
      // Add priority headers for faster delivery
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    console.log("Sending high-priority email to:", to);

    const info = await globalTransporter.sendMail(mailOptions);
    console.log(`Email sent successfully. Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error: any) {
    console.error("Email sending error:", error);
    
    // Reset transporter on error
    globalTransporter = null;
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
