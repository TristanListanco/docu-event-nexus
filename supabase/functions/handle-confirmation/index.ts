import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Get allowed origins from environment variables
const allowedOrigins = [
  Deno.env.get('SITE_URL') || "https://docu-event-scheduling.vercel.app",
  "http://localhost:5173", // Development
  "http://localhost:3000"  // Alternative development port
];

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP
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

interface ConfirmationRequest {
  token: string;
  action: 'confirm' | 'decline' | 'check';
  userAgent?: string;
  ipAddress?: string;
}

// Function to detect real IP address from headers
const getClientIP = (req: Request): string => {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  const xClientIP = req.headers.get('x-client-ip');

  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  if (cfConnectingIP) return cfConnectingIP;
  if (xRealIP) return xRealIP;
  if (xClientIP) return xClientIP;

  return 'unknown';
};

// Function to generate ICS file content with correct timezone
const generateICSContent = (eventData: any, staffName: string): string => {
  // Create date objects in Philippine timezone (UTC+8)
  const eventDate = eventData.date; // Format: YYYY-MM-DD
  const startTime = eventData.start_time; // Format: HH:MM
  const endTime = eventData.end_time; // Format: HH:MM
  
  // Parse times and create proper datetime strings for Philippine timezone
  const startDateTime = `${eventDate}T${startTime}:00`;
  const endDateTime = `${eventDate}T${endTime}:00`;
  
  // Format for ICS (YYYYMMDDTHHMMSS - local time)
  const formatDateForICS = (dateTimeStr: string) => {
    return dateTimeStr.replace(/[-:]/g, '').replace('T', 'T');
  };
  
  const startFormatted = formatDateForICS(startDateTime);
  const endFormatted = formatDateForICS(endDateTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Management//Event Calendar//EN
BEGIN:VTIMEZONE
TZID:Asia/Manila
BEGIN:STANDARD
DTSTART:19701101T000000
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:PST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${eventData.id}@eventmanagement.com
DTSTAMP:${now}
DTSTART;TZID=Asia/Manila:${startFormatted}
DTEND;TZID=Asia/Manila:${endFormatted}
SUMMARY:${eventData.name}
DESCRIPTION:You have confirmed your attendance for this event.\\nRole: Staff Member\\nOrganizer: ${eventData.organizer || 'N/A'}
LOCATION:${eventData.location}
STATUS:CONFIRMED
ATTENDEE:CN=${staffName}
BEGIN:VALARM
TRIGGER:-PT360M
ACTION:DISPLAY
DESCRIPTION:Event reminder (6 hours): ${eventData.name}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Event reminder (1 hour): ${eventData.name}
END:VALARM
END:VEVENT
END:VCALENDAR`;
};

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
    const requestData: ConfirmationRequest = await req.json();
    const { token, action, userAgent } = requestData;
    
    const detectedIP = getClientIP(req);
    
    const logger = {
      debug: (msg: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(msg, data);
        }
      },
      error: (msg: string, error?: any) => {
        // Always log errors but sanitize sensitive data
        console.error(msg, error ? { message: error.message, code: error.code } : '');
      }
    };

    logger.debug("=== ASSIGNMENT CONFIRMATION REQUEST ===");
    logger.debug("Token:", token);
    logger.debug("Action:", action);
    logger.debug("Client IP (detected):", detectedIP);
    logger.debug("Timestamp:", new Date().toISOString());
    
    // Check rate limit
    if (!checkRateLimit(detectedIP)) {
      logger.debug("Rate limit exceeded");
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED"
        }),
        { status: 429, headers }
      );
    }

    // Step 1: Find the assignment by token
    logger.debug("Step 1: Looking up assignment by token...");
    const { data: assignment, error: fetchError } = await supabase
      .from('staff_assignments')
      .select(`
        id,
        event_id,
        staff_id,
        user_id,
        confirmation_status,
        confirmation_token_expires_at,
        confirmed_at,
        declined_at,
        events(id, name, date, start_time, end_time, location, organizer),
        staff_members(name, email)
      `)
      .eq('confirmation_token', token)
      .single();

    if (fetchError || !assignment) {
      logger.debug("Assignment not found for token:", token);
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired confirmation token",
          code: "INVALID_TOKEN"
        }),
        { status: 404, headers }
      );
    }

    logger.debug("Assignment found:", {
      id: assignment.id,
      eventName: assignment.events?.name,
      staffName: assignment.staff_members?.name,
      currentStatus: assignment.confirmation_status
    });

    // Step 2: Check if token is expired
    logger.debug("Step 2: Checking token expiry...");
    if (assignment.confirmation_token_expires_at && 
        new Date() > new Date(assignment.confirmation_token_expires_at)) {
      logger.debug("Token expired");
      return new Response(
        JSON.stringify({ 
          error: "Confirmation token has expired",
          code: "TOKEN_EXPIRED"
        }),
        { status: 400, headers }
      );
    }

    // Prepare assignment data for response
    const assignmentData = {
      id: assignment.id,
      eventName: assignment.events?.name,
      staffName: assignment.staff_members?.name,
      eventDate: assignment.events?.date,
      startTime: assignment.events?.start_time,
      endTime: assignment.events?.end_time,
      location: assignment.events?.location
    };

    // If this is just a check action, return current status
    if (action === 'check') {
      let icsContent = null;
      if (assignment.confirmation_status === 'confirmed') {
        icsContent = generateICSContent(assignment.events, assignment.staff_members?.name || 'Staff Member');
      }

      return new Response(
        JSON.stringify({ 
          status: assignment.confirmation_status === 'confirmed' ? 'already_confirmed' : 
                  assignment.confirmation_status === 'declined' ? 'already_declined' : 'pending',
          assignment: assignmentData,
          icsFile: icsContent,
          timestamp: assignment.confirmation_status === 'confirmed' ? assignment.confirmed_at :
                    assignment.confirmation_status === 'declined' ? assignment.declined_at : null
        }),
        { status: 200, headers }
      );
    }

    // Step 3: Check if already processed
    logger.debug("Step 3: Checking if already processed...");
    if (assignment.confirmation_status === 'confirmed') {
      logger.debug("Assignment already confirmed");
      
      // Generate ICS file for confirmed events
      const icsContent = generateICSContent(assignment.events, assignment.staff_members?.name || 'Staff Member');
      
      return new Response(
        JSON.stringify({ 
          message: "Assignment already confirmed",
          status: "already_confirmed",
          assignment: assignmentData,
          icsFile: icsContent,
          timestamp: assignment.confirmed_at
        }),
        { status: 200, headers }
      );
    }

    if (assignment.confirmation_status === 'declined') {
      logger.debug("Assignment already declined");
      return new Response(
        JSON.stringify({ 
          message: "Assignment already declined",
          status: "already_declined",
          assignment: assignmentData,
          timestamp: assignment.declined_at
        }),
        { status: 200, headers }
      );
    }

    // Step 4: Update assignment status
    logger.debug(`Step 4: Processing ${action} action...`);
    const now = new Date().toISOString();
    const updateData = action === 'confirm' 
      ? {
          confirmation_status: 'confirmed',
          confirmed_at: now,
          declined_at: null
        }
      : {
          confirmation_status: 'declined',
          declined_at: now,
          confirmed_at: null
        };

    const { error: updateError } = await supabase
      .from('staff_assignments')
      .update(updateData)
      .eq('id', assignment.id);

    if (updateError) {
      console.error("Error updating assignment:", updateError);
      throw updateError;
    }

    logger.debug(`Assignment ${action}ed successfully`);

    // Step 5: Create notification for the admin
    logger.debug("Step 5: Creating notification for admin...");
    const notificationMessage = action === 'confirm' 
      ? `${assignment.staff_members?.name} confirmed their assignment for ${assignment.events?.name}`
      : `${assignment.staff_members?.name} declined their assignment for ${assignment.events?.name}`;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: assignment.user_id,
        event_id: assignment.event_id,
        staff_id: assignment.staff_id,
        type: action === 'confirm' ? 'confirmation' : 'decline',
        staff_name: assignment.staff_members?.name || 'Unknown Staff',
        event_name: assignment.events?.name || 'Unknown Event',
        message: notificationMessage
      });

    if (notificationError) {
      logger.error("Error creating notification:", notificationError);
      // Don't fail the request if notification creation fails
    } else {
      logger.debug("Notification created successfully");
    }

    // Step 6: Generate ICS file for confirmed events
    let icsContent = null;
    if (action === 'confirm') {
      icsContent = generateICSContent(assignment.events, assignment.staff_members?.name || 'Staff Member');
    }

    logger.debug("=== CONFIRMATION ACTION COMPLETED ===");
    logger.debug(`Action: ${action.toUpperCase()}`);
    logger.debug("Staff member:", assignment.staff_members?.name);
    logger.debug("Event:", assignment.events?.name);
    logger.debug("Final status:", updateData.confirmation_status);

    return new Response(
      JSON.stringify({ 
        success: true,
        action: action,
        status: updateData.confirmation_status,
        assignment: assignmentData,
        icsFile: icsContent,
        timestamp: now
      }),
      {
        status: 200,
        headers,
      }
    );

  } catch (error: any) {
    logger.error("=== CONFIRMATION ERROR ===");
    logger.error("Error message:", error.message);
    logger.error("Full error:", error);
    
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
