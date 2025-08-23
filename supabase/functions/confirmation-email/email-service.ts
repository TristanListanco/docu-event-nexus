

import nodemailer from "npm:nodemailer@6.9.8";

// Create a reusable transporter with connection pooling for better performance
let transporter: any = null;

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
    pool: true, // Use connection pooling
    maxConnections: 3, // Limit concurrent connections
    maxMessages: 100, // Send up to 100 messages per connection
  });
};

export async function sendEmailWithNodemailer(to: string, subject: string, html: string) {
  try {
    // Create transporter if it doesn't exist or reuse existing one
    if (!transporter) {
      console.log("Creating new email transporter with pooling...");
      transporter = createTransporter();
    }

    const mailOptions = {
      from: `"CCS Event Management" <${Deno.env.get("GMAIL_USER")}>`,
      to: to,
      subject: subject,
      html: html,
    };

    console.log("Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully. Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error: any) {
    console.error("Email sending error:", error);
    
    // Reset transporter on error to force recreation
    transporter = null;
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

