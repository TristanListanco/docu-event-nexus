
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { sendEmailWithNodemailer } from "./email-service.ts";
import { generateConfirmationEmailTemplate } from "./email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ConfirmationEmailRequest {
  eventId: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer?: string;
  type: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ConfirmationEmailRequest = await req.json();
    
    console.log("=== CONFIRMATION EMAIL REQUEST ===");
    console.log("Event ID:", requestData.eventId);
    console.log("Staff ID:", requestData.staffId);
    console.log("Staff Email:", requestData.staffEmail);
    console.log("Staff Name:", requestData.staffName);
    console.log("Staff Role:", requestData.staffRole);
    console.log("Event Name:", requestData.eventName);
    
    // Step 1: Check if assignment exists
    console.log("Step 1: Checking existing assignment...");
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('staff_assignments')
      .select('id, confirmation_token, confirmation_token_expires_at, confirmation_status')
      .eq('event_id', requestData.eventId)
      .eq('staff_id', requestData.staffId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      console.log("No existing assignment found, this should not happen");
      return new Response(
        JSON.stringify({ 
          error: "Assignment not found",
          details: "Staff assignment should be created before sending confirmation email"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (fetchError) {
      console.error("Database error fetching assignment:", fetchError);
      throw fetchError;
    }

    console.log("Existing assignment found:", {
      id: existingAssignment.id,
      status: existingAssignment.confirmation_status,
      tokenExists: !!existingAssignment.confirmation_token,
      expiresAt: existingAssignment.confirmation_token_expires_at
    });

    // Step 2: Generate or use existing token
    let confirmationToken = existingAssignment.confirmation_token;
    let tokenExpiresAt = existingAssignment.confirmation_token_expires_at;
    
    if (!confirmationToken || !tokenExpiresAt || new Date() > new Date(tokenExpiresAt)) {
      console.log("Generating new confirmation token...");
      
      confirmationToken = crypto.randomUUID();
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 7);
      tokenExpiresAt = newExpiryDate.toISOString();

      console.log("New token generated:", {
        token: confirmationToken,
        expiresAt: tokenExpiresAt
      });

      const { error: updateError } = await supabase
        .from('staff_assignments')
        .update({
          confirmation_token: confirmationToken,
          confirmation_token_expires_at: tokenExpiresAt,
          confirmation_status: 'pending',
          confirmed_at: null,
          declined_at: null
        })
        .eq('id', existingAssignment.id);

      if (updateError) {
        console.error("Error updating assignment with new token:", updateError);
        throw updateError;
      }
      
      console.log("Assignment updated with new token successfully");
    } else {
      console.log("Using existing valid token");
    }

    // Step 3: Generate email content
    console.log("Step 3: Generating email content...");
    const baseUrl = "https://docu-event-scheduling.vercel.app";
    const confirmationUrl = `${baseUrl}/confirm/${confirmationToken}`;
    
    console.log("Confirmation URL:", confirmationUrl);
    
    const { subject, html } = generateConfirmationEmailTemplate({
      staffName: requestData.staffName,
      staffRole: requestData.staffRole,
      eventName: requestData.eventName,
      eventDate: requestData.eventDate,
      startTime: requestData.startTime,
      endTime: requestData.endTime,
      location: requestData.location,
      organizer: requestData.organizer,
      type: requestData.type,
      confirmationUrl,
      tokenExpiresAt
    });

    // Step 4: Send email
    console.log("Step 4: Sending confirmation email...");
    const emailResponse = await sendEmailWithNodemailer(
      requestData.staffEmail,
      subject,
      html
    );

    console.log("Email sent successfully:", {
      messageId: emailResponse.messageId,
      to: requestData.staffEmail,
      subject: subject
    });

    // Step 5: Log success
    console.log("=== CONFIRMATION EMAIL SUCCESS ===");
    console.log("Final confirmation token:", confirmationToken);
    console.log("Token expires at:", tokenExpiresAt);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        confirmationToken,
        tokenExpiresAt,
        emailSent: true,
        messageId: emailResponse.messageId
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("=== CONFIRMATION EMAIL ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: error.code,
        details: error
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
