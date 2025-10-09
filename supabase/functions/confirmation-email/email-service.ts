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

// Keep the same function name/signature used by the rest of the codebase
export async function sendEmailWithNodemailer(
  to: string,
  subject: string,
  html: string
) {
  try {
    const resend = getResendClient();

    console.log("Sending high-priority email via Resend to:", to);

    const { data, error } = await resend.emails.send({
      from: "CCS Event Management <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
    });

    if (error) {
      throw new Error(error.message ?? "Failed to send email");
    }

    console.log(`Email sent successfully. ID: ${data?.id}`);

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
