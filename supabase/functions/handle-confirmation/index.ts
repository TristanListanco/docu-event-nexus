
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action'); // 'confirm' or 'decline'

    console.log('Confirmation request:', { token, action });

    if (!token || !action) {
      console.error('Missing token or action');
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Request</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Invalid Request</h1>
          <p>This confirmation link is invalid or missing required parameters.</p>
        </body>
        </html>`,
        { 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 400
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Looking up assignment with token:', token);

    // Find the staff assignment with this token
    const { data: assignment, error: assignmentError } = await supabase
      .from('staff_assignments')
      .select(`
        *,
        events(name, date, start_time, location),
        staff_members(name, email)
      `)
      .eq('confirmation_token', token)
      .single();

    if (assignmentError || !assignment) {
      console.error('Assignment lookup error:', assignmentError);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Token</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Invalid Confirmation Link</h1>
          <p>This confirmation link is invalid or has expired.</p>
        </body>
        </html>`,
        { 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 404
        }
      );
    }

    // Check if token is expired (24 hours)
    const expiresAt = new Date(assignment.confirmation_token_expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      console.error('Token expired:', { expiresAt, now });
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Link Expired</h1>
          <p>This confirmation link has expired. Please contact the event organizer for assistance.</p>
        </body>
        </html>`,
        { 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 410
        }
      );
    }

    // Check if already responded
    if (assignment.confirmation_status === 'confirmed' || assignment.confirmation_status === 'declined') {
      const status = assignment.confirmation_status;
      const statusText = status === 'confirmed' ? 'confirmed' : 'declined';
      const statusColor = status === 'confirmed' ? '#059669' : '#dc2626';
      
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Already Responded</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .status { color: ${statusColor}; }
            .event-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1 class="status">Already ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h1>
          <div class="event-info">
            <h3>${assignment.events.name}</h3>
            <p><strong>Date:</strong> ${new Date(assignment.events.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${assignment.events.start_time}</p>
            <p><strong>Location:</strong> ${assignment.events.location}</p>
          </div>
          <p>You have already ${statusText} your attendance for this event.</p>
        </body>
        </html>`,
        { 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 200
        }
      );
    }

    // Update the assignment
    const updateData = {
      confirmation_status: action,
      ...(action === 'confirm' ? { confirmed_at: new Date().toISOString() } : { declined_at: new Date().toISOString() })
    };

    console.log('Updating assignment:', updateData);

    const { error: updateError } = await supabase
      .from('staff_assignments')
      .update(updateData)
      .eq('id', assignment.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Update Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Update Failed</h1>
          <p>There was an error processing your response. Please try again or contact the event organizer.</p>
        </body>
        </html>`,
        { 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 500
        }
      );
    }

    // Create notification for the organizer
    const notificationMessage = `${assignment.staff_members.name} has ${action === 'confirm' ? 'confirmed' : 'declined'} attendance for ${assignment.events.name}`;
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: assignment.user_id,
        staff_id: assignment.staff_id,
        event_id: assignment.event_id,
        type: action === 'confirm' ? 'confirmation' : 'decline',
        message: notificationMessage,
        staff_name: assignment.staff_members.name,
        event_name: assignment.events.name,
        read: false
      });

    if (notificationError) {
      console.error('Notification error:', notificationError);
    }

    // Success response
    const actionText = action === 'confirm' ? 'confirmed' : 'declined';
    const statusColor = action === 'confirm' ? '#059669' : '#dc2626';
    
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Response Recorded</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center; 
            background-color: #f9fafb;
          }
          .success { color: ${statusColor}; margin-bottom: 20px; }
          .event-info { 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            margin: 25px 0; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .event-info h3 { 
            margin-top: 0; 
            color: #1f2937; 
            font-size: 1.5em;
          }
          .event-details { 
            text-align: left; 
            display: inline-block; 
          }
          .event-details p { 
            margin: 8px 0; 
            color: #4b5563; 
          }
          .thank-you { 
            color: #6b7280; 
            font-style: italic; 
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1 class="success">✓ Response Recorded</h1>
        <p>Thank you! You have successfully <strong>${actionText}</strong> your attendance.</p>
        
        <div class="event-info">
          <h3>${assignment.events.name}</h3>
          <div class="event-details">
            <p><strong>Date:</strong> ${new Date(assignment.events.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${assignment.events.start_time}</p>
            <p><strong>Location:</strong> ${assignment.events.location}</p>
            <p><strong>Staff Member:</strong> ${assignment.staff_members.name}</p>
          </div>
        </div>
        
        <p class="thank-you">
          ${action === 'confirm' 
            ? 'We look forward to seeing you at the event!' 
            : 'Thank you for letting us know. We understand and appreciate your response.'
          }
        </p>
      </body>
      </html>`,
      { 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .error { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1 class="error">Server Error</h1>
        <p>An unexpected error occurred. Please try again later or contact the event organizer.</p>
      </body>
      </html>`,
      { 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 500
      }
    );
  }
});
