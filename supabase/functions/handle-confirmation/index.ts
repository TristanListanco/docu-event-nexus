
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPreflightRequest } from './cors-utils.ts';
import { parseRequest } from './request-parser.ts';
import { AssignmentService } from './assignment-service.ts';
import { TokenValidator } from './token-validator.ts';
import * as htmlResponses from './html-responses.ts';
import * as jsonResponses from './json-responses.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const { token, action, isDirectCall } = await parseRequest(req);

    console.log('Confirmation request:', { token, action, isDirectCall });

    if (!token || !action) {
      console.error('Missing token or action');
      
      if (isDirectCall) {
        return htmlResponses.createInvalidRequestResponse();
      } else {
        return jsonResponses.createInvalidRequestJsonResponse();
      }
    }

    const assignmentService = new AssignmentService();
    const assignment = await assignmentService.findAssignmentByToken(token);

    if (!assignment) {
      if (isDirectCall) {
        return htmlResponses.createInvalidTokenResponse();
      } else {
        return jsonResponses.createInvalidTokenJsonResponse();
      }
    }

    // Check if event is cancelled
    if (assignment.events.status === 'Cancelled') {
      if (isDirectCall) {
        return htmlResponses.createCancelledEventResponse(assignment);
      } else {
        return jsonResponses.createCancelledEventJsonResponse();
      }
    }

    const tokenValidator = new TokenValidator(assignmentService);
    const { isExpired } = await tokenValidator.validateToken(assignment);
    
    if (isExpired) {
      if (isDirectCall) {
        return htmlResponses.createExpiredTokenResponse();
      } else {
        return jsonResponses.createExpiredTokenJsonResponse();
      }
    }

    // Handle 'check' action - just return the current status
    if (action === 'check') {
      return jsonResponses.createCheckStatusResponse(assignment);
    }

    // Check if already responded
    if (tokenValidator.isAlreadyResponded(assignment)) {
      if (isDirectCall) {
        return htmlResponses.createAlreadyRespondedResponse(assignment);
      } else {
        return jsonResponses.createAlreadyRespondedJsonResponse(assignment);
      }
    }

    // Handle confirm/decline actions
    if (action === 'confirm' || action === 'decline') {
      const updateSuccess = await assignmentService.updateAssignmentStatus(assignment.id, action);

      if (!updateSuccess) {
        if (isDirectCall) {
          return htmlResponses.createUpdateFailedResponse();
        } else {
          return jsonResponses.createUpdateFailedJsonResponse();
        }
      }

      // Create notification for the organizer
      await assignmentService.createNotification(assignment, action);

      // Success response
      const confirmationStatus = action === 'confirm' ? 'confirmed' : 'declined';
      
      if (isDirectCall) {
        return htmlResponses.createSuccessResponse(assignment, action);
      } else {
        return jsonResponses.createSuccessJsonResponse(confirmationStatus);
      }
    }

    // Invalid action
    if (isDirectCall) {
      return htmlResponses.createInvalidActionResponse();
    } else {
      return jsonResponses.createInvalidActionJsonResponse();
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Check if this is a direct call or client call for error response
    const url = new URL(req.url);
    const isDirectCall = url.searchParams.has('token') && url.searchParams.has('action');
    
    if (isDirectCall) {
      return htmlResponses.createServerErrorResponse();
    } else {
      return jsonResponses.createServerErrorJsonResponse();
    }
  }
});
