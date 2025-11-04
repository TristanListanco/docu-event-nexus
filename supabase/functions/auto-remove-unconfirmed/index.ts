import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all assignments that:
    // 1. Are pending confirmation
    // 2. Were sent more than 6 hours ago
    // 3. Event hasn't started yet
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data: expiredAssignments, error: fetchError } = await supabase
      .from('staff_assignments')
      .select(`
        *,
        staff_members!inner(name, email),
        events!inner(name, date, start_time, status)
      `)
      .eq('confirmation_status', 'pending')
      .not('last_invitation_sent_at', 'is', null)
      .lt('last_invitation_sent_at', sixHoursAgo);

    if (fetchError) {
      console.error('Error fetching expired assignments:', fetchError);
      throw fetchError;
    }

    if (!expiredAssignments || expiredAssignments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired assignments found', removed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out events that have already started
    const now = new Date();
    const assignmentsToRemove = expiredAssignments.filter((assignment: any) => {
      const eventDateTime = new Date(`${assignment.events.date} ${assignment.events.start_time}`);
      return eventDateTime > now && assignment.events.status === 'Upcoming';
    });

    if (assignmentsToRemove.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No valid expired assignments to remove', removed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove assignments and send emails
    let removedCount = 0;
    let emailsSent = 0;

    for (const assignment of assignmentsToRemove) {
      // Delete the assignment
      const { error: deleteError } = await supabase
        .from('staff_assignments')
        .delete()
        .eq('id', assignment.id);

      if (deleteError) {
        console.error(`Error deleting assignment ${assignment.id}:`, deleteError);
        continue;
      }

      removedCount++;

      // Send notification email
      try {
        const gmailUser = Deno.env.get('GMAIL_USER');
        if (!gmailUser) {
          console.error('GMAIL_USER not configured');
          continue;
        }

        await resend.emails.send({
          from: `Event Notifications <${gmailUser}>`,
          to: [assignment.staff_members.email],
          subject: `Removed from Event: ${assignment.events.name}`,
          html: `
            <h2>Assignment Removed Due to No Response</h2>
            <p>Dear ${assignment.staff_members.name},</p>
            <p>You have been removed from the following event due to no response to the confirmation request:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${assignment.events.name}</h3>
              <p><strong>Date:</strong> ${new Date(assignment.events.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${assignment.events.start_time}</p>
            </div>
            <p>We needed your confirmation within 6 hours of sending the invitation. Since we didn't receive a response, your assignment has been removed to allow for alternative arrangements.</p>
            <p>If this was a mistake or you still want to participate, please contact the event organizer directly.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This is an automated notification.</p>
          `,
        });
        emailsSent++;
      } catch (emailError) {
        console.error(`Error sending email for assignment ${assignment.id}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        removed: removedCount,
        emailsSent: emailsSent,
        message: `Removed ${removedCount} expired assignments and sent ${emailsSent} notification emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in auto-remove function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
