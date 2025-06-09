
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
      console.log(`Processing staff ${staff.id} for event ${eventId}`);
      
      // First, try to get existing assignment
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('staff_assignments')
        .select('confirmation_token, confirmation_token_expires_at, confirmation_status')
        .eq('event_id', eventId)
        .eq('staff_id', staff.id)
        .single();

      let confirmationToken = null;
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // No existing assignment - this should not happen as assignments should be created first
        console.log(`No existing assignment found for staff ${staff.id}, this might be an issue`);
        confirmationToken = null;
      } else if (existingAssignment) {
        // Check if existing token is still valid
        const now = new Date();
        const expiryDate = new Date(existingAssignment.confirmation_token_expires_at);
        
        console.log(`Existing assignment found. Token expires at: ${existingAssignment.confirmation_token_expires_at}, Current time: ${now.toISOString()}`);
        
        if (now < expiryDate && existingAssignment.confirmation_token && existingAssignment.confirmation_status === 'pending') {
          // Use existing valid token
          confirmationToken = existingAssignment.confirmation_token;
          console.log(`Using existing valid token for staff ${staff.id}`);
        } else {
          // Generate new token if expired, missing, or already confirmed/declined
          confirmationToken = crypto.randomUUID();
          const newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + 7);

          console.log(`Generating new token for staff ${staff.id}, expires: ${newExpiryDate.toISOString()}`);

          const { error: updateError } = await supabase
            .from('staff_assignments')
            .update({
              confirmation_token: confirmationToken,
              confirmation_token_expires_at: newExpiryDate.toISOString(),
              confirmation_status: 'pending',
              confirmed_at: null,
              declined_at: null
            })
            .eq('event_id', eventId)
            .eq('staff_id', staff.id);

          if (updateError) {
            console.error('Error updating assignment token:', updateError);
            confirmationToken = null;
          } else {
            console.log(`Successfully updated token for staff ${staff.id}`);
          }
        }
      } else {
        console.error(`Unexpected error fetching assignment for staff ${staff.id}:`, fetchError);
        confirmationToken = null;
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

  console.log(`Processed ${results.length} staff members, tokens generated for: ${results.filter(r => r.confirmationToken).length}`);
  return results;
}
