
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface AssignmentData {
  id: string;
  eventName: string;
  staffName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer?: string;
  type?: string;
}

export async function getAssignmentByToken(token: string): Promise<{
  assignment: AssignmentData | null;
  status: string;
  confirmedAt?: string;
  declinedAt?: string;
}> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('Fetching assignment for token:', token);

  const { data, error } = await supabase
    .from('staff_assignments')
    .select(`
      *,
      events!inner(
        id,
        name,
        date,
        start_time,
        end_time,
        location,
        organizer,
        type
      ),
      staff_members!inner(
        name
      )
    `)
    .eq('confirmation_token', token)
    .maybeSingle();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch assignment');
  }

  if (!data) {
    console.log('No assignment found for token');
    return {
      assignment: null,
      status: 'not_found'
    };
  }

  console.log('Assignment found:', data);

  const assignment: AssignmentData = {
    id: data.events.id,
    eventName: data.events.name,
    staffName: data.staff_members.name,
    eventDate: data.events.date,
    startTime: data.events.start_time,
    endTime: data.events.end_time,
    location: data.events.location,
    organizer: data.events.organizer,
    type: data.events.type
  };

  let status = 'pending';
  if (data.confirmation_status === 'confirmed') {
    status = 'confirmed';
  } else if (data.confirmation_status === 'declined') {
    status = 'declined';
  }

  return {
    assignment,
    status,
    confirmedAt: data.confirmed_at,
    declinedAt: data.declined_at
  };
}

export async function updateAssignmentStatus(
  token: string, 
  action: 'confirm' | 'decline'
): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log(`Updating assignment status to ${action} for token:`, token);

  const now = new Date().toISOString();
  const updateData: any = {
    confirmation_status: action === 'confirm' ? 'confirmed' : 'declined'
  };

  if (action === 'confirm') {
    updateData.confirmed_at = now;
    updateData.declined_at = null;
  } else {
    updateData.declined_at = now;
    updateData.confirmed_at = null;
  }

  const { error } = await supabase
    .from('staff_assignments')
    .update(updateData)
    .eq('confirmation_token', token);

  if (error) {
    console.error('Error updating assignment:', error);
    throw new Error(`Failed to ${action} assignment`);
  }

  // Create notification for the admin
  try {
    const { data: assignmentData } = await supabase
      .from('staff_assignments')
      .select(`
        user_id,
        events!inner(name, id),
        staff_members!inner(name)
      `)
      .eq('confirmation_token', token)
      .single();

    if (assignmentData) {
      await supabase
        .from('notifications')
        .insert({
          user_id: assignmentData.user_id,
          event_id: assignmentData.events.id,
          staff_id: assignmentData.staff_members.name,
          type: action === 'confirm' ? 'confirmation' : 'decline',
          message: `${assignmentData.staff_members.name} has ${action === 'confirm' ? 'confirmed' : 'declined'} assignment for ${assignmentData.events.name}`,
          staff_name: assignmentData.staff_members.name,
          event_name: assignmentData.events.name
        });
    }
  } catch (notificationError) {
    console.error('Error creating notification:', notificationError);
    // Don't fail the main operation if notification fails
  }

  console.log(`Assignment ${action}ed successfully`);
  return {
    success: true,
    message: `Assignment ${action}ed successfully`
  };
}
