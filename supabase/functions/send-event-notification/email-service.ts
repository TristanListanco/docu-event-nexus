import { Resend } from "npm:resend@4.0.0";

// Reusable Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  if (!resendClient) {
    console.log("Creating Resend client...");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmailWithNodemailer(
  to: string,
  subject: string,
  html: string,
  icsContent?: string
) {
  try {
    const resend = getResendClient();

    const attachments = icsContent
      ? [
          {
            filename: "event.ics",
            content: icsContent,
            contentType: "text/calendar",
          },
        ]
      : undefined;

    const { data, error } = await resend.emails.send({
      from: "CCS Event Management <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      attachments,
    });

    if (error) {
      throw new Error(error.message ?? "Failed to send email");
    }

    console.log(`Email sent to ${to}:`, data?.id);

    return {
      success: true,
      messageId: data?.id,
      response: "sent",
    };
  } catch (error: any) {
    console.error("Email sending error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
