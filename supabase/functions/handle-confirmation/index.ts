
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();
    
    if (!token || !action) {
      return new Response(
        JSON.stringify({ error: "Missing token or action" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing ${action} for token: ${token}`);

    // Find the assignment by token
    const { data: assignment, error: fetchError } = await supabase
      .from('staff_assignments')
      .select(`
        *,
        events(name, date, start_time, end_time, location, user_id),
        staff_members(name, email)
      `)
      .eq('confirmation_token', token)
      .single();

    if (fetchError || !assignment) {
      console.error('Assignment not found:', fetchError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiryDate = new Date(assignment.confirmation_token_expires_at);
    if (now > expiryDate) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Handle the 'check' action to get current status
    if (action === 'check') {
      return new Response(
        JSON.stringify({
          status: assignment.confirmation_status || 'pending',
          assignment: {
            id: assignment.id,
            eventName: assignment.events.name,
            staffName: assignment.staff_members.name,
            eventDate: assignment.events.date,
            startTime: assignment.events.start_time,
            endTime: assignment.events.end_time,
            location: assignment.events.location
          },
          timestamp: assignment.confirmed_at || assignment.declined_at
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Handle confirm/decline actions
    if (action !== 'confirm' && action !== 'decline') {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update the assignment based on action
    const updateData: any = {
      confirmation_status: action === 'confirm' ? 'confirmed' : 'declined',
      confirmation_token: null, // Clear the token after use
      confirmation_token_expires_at: null
    };

    if (action === 'confirm') {
      updateData.confirmed_at = new Date().toISOString();
      updateData.declined_at = null;
    } else if (action === 'decline') {
      updateData.declined_at = new Date().toISOString();
      updateData.confirmed_at = null;
    }

    const { error: updateError } = await supabase
      .from('staff_assignments')
      .update(updateData)
      .eq('id', assignment.id);

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update assignment" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create a notification for the event organizer
    const notificationMessage = action === 'confirm' 
      ? `${assignment.staff_members.name} has confirmed their assignment`
      : `${assignment.staff_members.name} has declined their assignment`;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: assignment.events.user_id,
        event_id: assignment.event_id,
        staff_id: assignment.staff_id,
        type: action === 'confirm' ? 'confirmed' : 'declined',
        staff_name: assignment.staff_members.name,
        event_name: assignment.events.name,
        message: notificationMessage
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    console.log(`Assignment ${action}ed successfully for ${assignment.staff_members.name}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        status: action === 'confirm' ? 'confirmed' : 'declined',
        message: `Assignment ${action}ed successfully`,
        eventName: assignment.events.name,
        staffName: assignment.staff_members.name,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in handle-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
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
