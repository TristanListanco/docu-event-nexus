
import { corsHeaders } from './cors-utils.ts';
import { AssignmentData } from './types.ts';

export function createCancelledEventJsonResponse(): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Event has been cancelled',
      status: 'cancelled'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

export function createInvalidRequestJsonResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Missing token or action' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    }
  );
}

export function createInvalidTokenJsonResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Invalid or expired confirmation token' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404
    }
  );
}

export function createExpiredTokenJsonResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Confirmation link has expired' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 410
    }
  );
}

export function createCheckStatusResponse(assignment: AssignmentData): Response {
  const responseData = {
    success: true,
    status: assignment.confirmation_status || 'pending',
    assignment: {
      id: assignment.id,
      eventName: assignment.events.name,
      staffName: assignment.staff_members.name,
      eventDate: assignment.events.date,
      startTime: assignment.events.start_time,
      endTime: assignment.events.end_time || '',
      location: assignment.events.location
    },
    timestamp: assignment.confirmed_at || assignment.declined_at || null
  };

  return new Response(
    JSON.stringify(responseData),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

export function createAlreadyRespondedJsonResponse(assignment: AssignmentData): Response {
  const status = assignment.confirmation_status;
  
  return new Response(
    JSON.stringify({ 
      success: true,
      status: status,
      message: `Assignment already ${status}`,
      timestamp: assignment.confirmed_at || assignment.declined_at
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

export function createSuccessJsonResponse(confirmationStatus: string): Response {
  return new Response(
    JSON.stringify({ 
      success: true,
      status: confirmationStatus,
      message: `Assignment ${confirmationStatus} successfully`,
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

export function createUpdateFailedJsonResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Failed to update assignment' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    }
  );
}

export function createInvalidActionJsonResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Invalid action' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    }
  );
}

export function createServerErrorJsonResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'An unexpected error occurred' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    }
  );
}
