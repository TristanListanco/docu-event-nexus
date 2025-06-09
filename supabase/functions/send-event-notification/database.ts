
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getStaffWithTokens(
  assignedStaff: Array<{ id: string; name: string; email?: string; role: string }>,
  eventId: string
) {
  const results = [];

  for (const staff of assignedStaff) {
    try {
      // Get existing assignment or create new one
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('staff_assignments')
        .select('confirmation_token, confirmation_token_expires_at')
        .eq('event_id', eventId)
        .eq('staff_id', staff.id)
        .single();

      let confirmationToken = null;
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // No existing assignment, create a new one with token
        confirmationToken = crypto.randomUUID();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now

        const { error: insertError } = await supabase
          .from('staff_assignments')
          .insert({
            event_id: eventId,
            staff_id: staff.id,
            confirmation_token: confirmationToken,
            confirmation_token_expires_at: expiryDate.toISOString(),
            confirmation_status: 'pending'
          });

        if (insertError) {
          console.error('Error creating assignment:', insertError);
          confirmationToken = null;
        }
      } else if (existingAssignment) {
        // Check if existing token is still valid
        const now = new Date();
        const expiryDate = new Date(existingAssignment.confirmation_token_expires_at);
        
        if (now < expiryDate && existingAssignment.confirmation_token) {
          // Use existing valid token
          confirmationToken = existingAssignment.confirmation_token;
        } else {
          // Generate new token if expired or missing
          confirmationToken = crypto.randomUUID();
          const newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + 7);

          const { error: updateError } = await supabase
            .from('staff_assignments')
            .update({
              confirmation_token: confirmationToken,
              confirmation_token_expires_at: newExpiryDate.toISOString(),
              confirmation_status: 'pending'
            })
            .eq('event_id', eventId)
            .eq('staff_id', staff.id);

          if (updateError) {
            console.error('Error updating assignment token:', updateError);
            confirmationToken = null;
          }
        }
      }

      results.push({
        ...staff,
        confirmationToken
      });
    } catch (error) {
      console.error(`Error processing staff ${staff.id}:`, error);
      results.push({
        ...staff,
        confirmationToken: null
      });
    }
  }

  return results;
}
