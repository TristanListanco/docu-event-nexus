
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ConfirmationRequest {
  token: string;
  action: 'confirm' | 'decline';
  userAgent?: string;
  ipAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ConfirmationRequest = await req.json();
    const { token, action, userAgent, ipAddress } = requestData;
    
    console.log("=== ASSIGNMENT CONFIRMATION REQUEST ===");
    console.log("Token:", token);
    console.log("Action:", action);
    console.log("User Agent:", userAgent);
    console.log("IP Address:", ipAddress);
    console.log("Timestamp:", new Date().toISOString());
    
    // Step 1: Find the assignment by token
    console.log("Step 1: Looking up assignment by token...");
    const { data: assignment, error: fetchError } = await supabase
      .from('staff_assignments')
      .select(`
        id,
        event_id,
        staff_id,
        confirmation_status,
        confirmation_token_expires_at,
        events(name, date, start_time, end_time, location),
        staff_members(name, email)
      `)
      .eq('confirmation_token', token)
      .single();

    if (fetchError || !assignment) {
      console.error("Assignment not found for token:", token);
      console.error("Database error:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired confirmation token",
          code: "INVALID_TOKEN"
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Assignment found:", {
      id: assignment.id,
      eventName: assignment.events?.name,
      staffName: assignment.staff_members?.name,
      currentStatus: assignment.confirmation_status
    });

    // Step 2: Check if token is expired
    console.log("Step 2: Checking token expiry...");
    if (assignment.confirmation_token_expires_at && 
        new Date() > new Date(assignment.confirmation_token_expires_at)) {
      console.error("Token expired:", {
        expiresAt: assignment.confirmation_token_expires_at,
        currentTime: new Date().toISOString()
      });
      return new Response(
        JSON.stringify({ 
          error: "Confirmation token has expired",
          code: "TOKEN_EXPIRED",
          expiresAt: assignment.confirmation_token_expires_at
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Step 3: Check if already processed
    console.log("Step 3: Checking if already processed...");
    if (assignment.confirmation_status === 'confirmed') {
      console.log("Assignment already confirmed");
      return new Response(
        JSON.stringify({ 
          message: "Assignment already confirmed",
          status: "already_confirmed"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (assignment.confirmation_status === 'declined') {
      console.log("Assignment already declined");
      return new Response(
        JSON.stringify({ 
          message: "Assignment already declined",
          status: "already_declined"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Step 4: Update assignment status - let's not update attendance_status for now
    console.log(`Step 4: Processing ${action} action...`);
    const updateData = action === 'confirm' 
      ? {
          confirmation_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          declined_at: null
        }
      : {
          confirmation_status: 'declined',
          declined_at: new Date().toISOString(),
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

    console.log(`Assignment ${action}ed successfully`);

    // Step 5: Log the action
    console.log("=== CONFIRMATION SUCCESS ===");
    console.log("Action completed:", action.toUpperCase());
    console.log("Staff member:", assignment.staff_members?.name);
    console.log("Event:", assignment.events?.name);
    console.log("Final status:", updateData.confirmation_status);
    console.log("Processed at:", new Date().toISOString());

    return new Response(
      JSON.stringify({ 
        success: true,
        action: action,
        status: updateData.confirmation_status,
        assignment: {
          id: assignment.id,
          eventName: assignment.events?.name,
          staffName: assignment.staff_members?.name,
          eventDate: assignment.events?.date,
          startTime: assignment.events?.start_time,
          endTime: assignment.events?.end_time,
          location: assignment.events?.location
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("=== CONFIRMATION ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error details:", error);
    console.error("Stack trace:", error.stack);
    console.error("Timestamp:", new Date().toISOString());
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: error.code,
        type: error.constructor.name,
        details: error,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
