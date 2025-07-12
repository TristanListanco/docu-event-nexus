
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting cleanup of expired leave dates...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Checking for leave dates ending before: ${today}`);

    // Find all expired leave dates (end_date < today)
    const { data: expiredLeaves, error: fetchError } = await supabase
      .from('leave_dates')
      .select('*')
      .lt('end_date', today);

    if (fetchError) {
      console.error('Error fetching expired leaves:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredLeaves?.length || 0} expired leave records`);

    if (expiredLeaves && expiredLeaves.length > 0) {
      // Delete expired leave dates
      const { error: deleteError } = await supabase
        .from('leave_dates')
        .delete()
        .lt('end_date', today);

      if (deleteError) {
        console.error('Error deleting expired leaves:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully deleted ${expiredLeaves.length} expired leave records`);

      // Log the cleanup for audit purposes
      const expiredStaffIds = [...new Set(expiredLeaves.map(leave => leave.staff_id))];
      console.log(`Cleaned up expired leaves for staff IDs: ${expiredStaffIds.join(', ')}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${expiredLeaves?.length || 0} expired leave records`,
        cleanedLeaves: expiredLeaves?.length || 0,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in cleanup-expired-leaves function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
