
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AssignmentData } from './types.ts';

export class AssignmentService {
  private supabase;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async findAssignmentByToken(token: string): Promise<AssignmentData | null> {
    console.log('Looking up assignment with token:', token);

    const { data: assignment, error: assignmentError } = await this.supabase
      .from('staff_assignments')
      .select(`
        *,
        events(name, date, start_time, location, end_time),
        staff_members(name, email)
      `)
      .eq('confirmation_token', token)
      .single();

    if (assignmentError || !assignment) {
      console.error('Assignment lookup error:', assignmentError);
      return null;
    }

    return assignment as AssignmentData;
  }

  async updateTokenExpiration(assignmentId: string, expiresAt: Date): Promise<void> {
    const { error: updateError } = await this.supabase
      .from('staff_assignments')
      .update({ confirmation_token_expires_at: expiresAt.toISOString() })
      .eq('id', assignmentId);
      
    if (updateError) {
      console.error('Error updating expiration:', updateError);
    }
  }

  async updateAssignmentStatus(assignmentId: string, action: string): Promise<boolean> {
    const confirmationStatus = action === 'confirm' ? 'confirmed' : 'declined';
    
    const updateData = {
      confirmation_status: confirmationStatus,
      ...(action === 'confirm' ? { confirmed_at: new Date().toISOString() } : { declined_at: new Date().toISOString() })
    };

    console.log('Updating assignment:', updateData);

    const { error: updateError } = await this.supabase
      .from('staff_assignments')
      .update(updateData)
      .eq('id', assignmentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return false;
    }

    return true;
  }

  async createNotification(assignment: AssignmentData, action: string): Promise<void> {
    const confirmationStatus = action === 'confirm' ? 'confirmed' : 'declined';
    const notificationMessage = `${assignment.staff_members.name} has ${confirmationStatus} attendance for ${assignment.events.name}`;
    
    const { error: notificationError } = await this.supabase
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
  }
}
