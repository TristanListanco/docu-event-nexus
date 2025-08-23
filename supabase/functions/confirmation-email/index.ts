
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { sendEmailWithNodemailer } from "./email-service.ts";
import { generateEmailTemplate } from "./email-template.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

// Simplified rate limiting
const RATE_LIMIT_WINDOW = 30 * 1000; // 30 seconds
const MAX_REQUESTS_PER_WINDOW = 3;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
};

interface EmailRequest {
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

  const headers = { 
    "Content-Type": "application/json",
    ...corsHeaders 
  };

  try {
    const requestData: EmailRequest = await req.json();
    console.log("=== CONFIRMATION EMAIL REQUEST ===");
    console.log("Event ID:", requestData.eventId);
    console.log("Staff Email:", requestData.staffEmail);

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    if (!checkRateLimit(clientIP)) {
      console.error("Rate limit exceeded for IP:", clientIP);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please wait before sending another invitation.",
          code: "RATE_LIMIT_EXCEEDED"
        }),
        { status: 429, headers }
      );
    }

    // Quick assignment check
    console.log("Fetching assignment...");
    const { data: assignment, error: assignmentError } = await supabase
      .from('staff_assignments')
      .select('id, confirmation_token')
      .eq('event_id', requestData.eventId)
      .eq('staff_id', requestData.staffId)
      .limit(1)
      .single();

    if (assignmentError || !assignment) {
      console.error("Assignment not found:", assignmentError);
      return new Response(
        JSON.stringify({ 
          error: "Assignment not found. Please ensure the staff member is assigned to this event.",
          details: assignmentError?.message
        }),
        { status: 404, headers }
      );
    }

    console.log("Assignment found:", assignment.id);

    // Update invitation timestamp immediately for better UX
    const now = new Date().toISOString();
    const updatePromise = supabase
      .from('staff_assignments')
      .update({ 
        manual_invitation_sent_at: now,
        last_invitation_sent_at: now
      })
      .eq('event_id', requestData.eventId)
      .eq('staff_id', requestData.staffId);

    // Return success immediately - don't wait for email
    const response = new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email is being sent",
        assignmentId: assignment.id
      }),
      { status: 200, headers }
    );

    // Send email in background using EdgeRuntime.waitUntil
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          console.log("Starting background email send...");
          
          // Wait for database update
          const { error: updateError } = await updatePromise;
          if (updateError) {
            console.error("Error updating invitation timestamp:", updateError);
          }

          // Generate email content
          const baseUrl = Deno.env.get('SITE_URL') || "https://docu-event-scheduling.vercel.app";
          const confirmUrl = `${baseUrl}/confirm-assignment?token=${assignment.confirmation_token}&action=confirm`;
          const declineUrl = `${baseUrl}/confirm-assignment?token=${assignment.confirmation_token}&action=decline`;

          const emailSubject = `Event Assignment: ${requestData.eventName}`;
          const emailHtml = generateEmailTemplate({
            staffName: requestData.staffName,
            eventName: requestData.eventName,
            eventDate: requestData.eventDate,
            startTime: requestData.startTime,
            endTime: requestData.endTime,
            location: requestData.location,
            organizer: requestData.organizer || 'N/A',
            role: requestData.staffRole,
            confirmUrl: confirmUrl,
            declineUrl: declineUrl
          });

          // Send email
          const emailResult = await sendEmailWithNodemailer(
            requestData.staffEmail,
            emailSubject,
            emailHtml
          );

          console.log("Background email sent successfully:", emailResult.messageId);

        } catch (error: any) {
          console.error("Background email sending failed:", error);
        }
      })()
    );

    return response;

  } catch (error: any) {
    console.error("=== EMAIL SENDING ERROR ===");
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process invitation request",
        details: error.message
      }),
      { status: 500, headers }
    );
  }
};

serve(handler);
