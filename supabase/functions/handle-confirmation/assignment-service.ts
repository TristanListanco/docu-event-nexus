
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { AssignmentData } from './types.ts';

export class AssignmentService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async findAssignmentByToken(token: string): Promise<AssignmentData | null> {
    console.log('Fetching assignment for token:', token);

    const { data, error } = await this.supabase
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
          status
        ),
        staff_members!inner(
          name,
          email
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
      return null;
    }

    console.log('Assignment found:', data);

    const assignment: AssignmentData = {
      id: data.id,
      confirmation_status: data.confirmation_status,
      confirmation_token_expires_at: data.confirmation_token_expires_at,
      confirmed_at: data.confirmed_at,
      declined_at: data.declined_at,
      user_id: data.user_id,
      staff_id: data.staff_id,
      event_id: data.event_id,
      events: {
        name: data.events.name,
        date: data.events.date,
        start_time: data.events.start_time,
        end_time: data.events.end_time,
        location: data.events.location,
        status: data.events.status
      },
      staff_members: {
        name: data.staff_members.name,
        email: data.staff_members.email
      }
    };

    return assignment;
  }

  async updateAssignmentStatus(
    assignmentId: string, 
    action: 'confirm' | 'decline'
  ): Promise<boolean> {
    console.log(`Updating assignment status to ${action} for ID:`, assignmentId);

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

    const { error } = await this.supabase
      .from('staff_assignments')
      .update(updateData)
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating assignment:', error);
      return false;
    }

    console.log(`Assignment ${action}ed successfully`);
    return true;
  }

  async createNotification(assignment: AssignmentData, action: 'confirm' | 'decline'): Promise<void> {
    try {
      await this.supabase
        .from('notifications')
        .insert({
          user_id: assignment.user_id,
          event_id: assignment.event_id,
          staff_id: assignment.staff_id,
          type: action === 'confirm' ? 'confirmation' : 'decline',
          message: `${assignment.staff_members.name} has ${action === 'confirm' ? 'confirmed' : 'declined'} assignment for ${assignment.events.name}`,
          staff_name: assignment.staff_members.name,
          event_name: assignment.events.name
        });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the main operation if notification fails
    }
  }

  async updateTokenExpiration(assignmentId: string, expiresAt: Date): Promise<void> {
    const { error } = await this.supabase
      .from('staff_assignments')
      .update({ confirmation_token_expires_at: expiresAt.toISOString() })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating token expiration:', error);
    }
  }
}
