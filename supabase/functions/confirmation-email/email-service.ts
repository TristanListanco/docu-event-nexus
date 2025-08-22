
import nodemailer from "npm:nodemailer@6.9.8";

// Create transporter once and reuse
let transporter: any = null;

const getTransporter = () => {
  if (!transporter) {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      throw new Error("Gmail credentials not configured");
    }

    console.log("Creating email transporter...");
    transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
      pool: true, // Use connection pooling
      maxConnections: 3,
      maxMessages: 10,
    });
  }
  
  return transporter;
};

export async function sendEmailWithNodemailer(to: string, subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  
  if (!gmailUser) {
    throw new Error("Gmail user not configured");
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"CCS Event Management" <${gmailUser}>`,
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
}
