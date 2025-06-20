import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { sendEmailWithNodemailer } from "./email-service.ts";
import { generateEmailTemplate } from "./email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get allowed origins from environment variables
const allowedOrigins = [
  Deno.env.get('SITE_URL') || "https://docu-event-scheduling.vercel.app",
  "http://localhost:5173", // Development
  "http://localhost:3000"  // Alternative development port
];

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 email requests per minute per IP (more restrictive)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
};

// Clean up old rate limit records
const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
};

// Clean up every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    const origin = req.headers.get('Origin');
    const headers = { ...corsHeaders };
    
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
    
    return new Response(null, { headers });
  }

  // Handle actual requests
  const origin = req.headers.get('Origin');
  const headers = { 
    "Content-Type": "application/json",
    ...corsHeaders 
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  try {
    const requestData: EmailRequest = await req.json();
    console.log("=== CONFIRMATION EMAIL REQUEST ===");
    console.log("Event ID:", requestData.eventId);
    console.log("Staff ID:", requestData.staffId);
    console.log("Staff Email:", requestData.staffEmail);
    console.log("Staff Name:", requestData.staffName);
    console.log("Staff Role:", requestData.staffRole);
    console.log("Event Name:", requestData.eventName);

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') || 
                    'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.error("Rate limit exceeded for IP:", clientIP);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED"
        }),
        { status: 429, headers }
      );
    }

    // Step 1: Check if assignment exists - get any existing assignment
    console.log("Step 1: Checking existing assignment...");
    let assignment = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts && !assignment) {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('staff_assignments')
        .select('id, confirmation_token, confirmation_token_expires_at')
        .eq('event_id', requestData.eventId)
        .eq('staff_id', requestData.staffId)
        .limit(1)
        .single();

      if (assignmentError) {
        console.error("Error fetching assignment:", assignmentError);
        if (assignmentError.code === 'PGRST116') {
          // No rows found, wait and retry
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`Assignment not found, retrying in ${attempts} seconds... (attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          }
        } else {
          throw assignmentError;
        }
      } else if (assignmentData) {
        assignment = assignmentData;
        break;
      }

      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Assignment not found, retrying in ${attempts} seconds... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, attempts * 1000));
      }
    }

    if (!assignment) {
      console.error("No assignment found after retries");
      return new Response(
        JSON.stringify({ 
          error: "Assignment not found",
          details: "The staff assignment could not be found in the database"
        }),
        { 
          status: 404, 
          headers
        }
      );
    }

    console.log("Assignment found:", assignment.id);

    // Step 2: Generate confirmation links using the production URL
    const baseUrl = Deno.env.get('SITE_URL') || "https://docu-event-scheduling.vercel.app";
    const confirmUrl = `${baseUrl}/confirm-assignment?token=${assignment.confirmation_token}&action=confirm`;
    const declineUrl = `${baseUrl}/confirm-assignment?token=${assignment.confirmation_token}&action=decline`;
    
    console.log("Confirmation URL:", confirmUrl);
    console.log("Decline URL:", declineUrl);

    // Step 3: Generate email content
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

    // Step 4: Send email
    console.log("Step 4: Sending email...");
    const emailResult = await sendEmailWithNodemailer(
      requestData.staffEmail,
      emailSubject,
      emailHtml
    );

    console.log("Email sent successfully:", emailResult.messageId);

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: emailResult.messageId,
        assignmentId: assignment.id
      }),
      {
        status: 200,
        headers,
      }
    );

  } catch (error: any) {
    console.error("=== EMAIL SENDING ERROR ===");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};

serve(handler);
