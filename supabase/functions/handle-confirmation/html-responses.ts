
import { corsHeaders } from './cors-utils.ts';
import { AssignmentData } from './types.ts';

export function createInvalidRequestResponse(): Response {
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

export function createInvalidTokenResponse(): Response {
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

export function createExpiredTokenResponse(): Response {
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

export function createAlreadyRespondedResponse(assignment: AssignmentData): Response {
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

export function createSuccessResponse(assignment: AssignmentData, action: string): Response {
  const confirmationStatus = action === 'confirm' ? 'confirmed' : 'declined';
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
      <p>Thank you! You have successfully <strong>${confirmationStatus}</strong> your attendance.</p>
      
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
}

export function createUpdateFailedResponse(): Response {
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

export function createInvalidActionResponse(): Response {
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>Invalid Action</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .error { color: #dc2626; }
      </style>
    </head>
    <body>
      <h1 class="error">Invalid Action</h1>
      <p>The requested action is not valid.</p>
    </body>
    </html>`,
    { 
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 400
    }
  );
}

export function createServerErrorResponse(): Response {
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
