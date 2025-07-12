
import { AssignmentData } from './types.ts';
import { AssignmentService } from './assignment-service.ts';

export class TokenValidator {
  constructor(private assignmentService: AssignmentService) {}

  async validateToken(assignment: AssignmentData): Promise<{ isValid: boolean; isExpired: boolean }> {
    // Enhanced logging for token expiration debugging
    console.log('Assignment found:', {
      id: assignment.id,
      confirmation_token_expires_at: assignment.confirmation_token_expires_at,
      raw_expires_at: assignment.confirmation_token_expires_at
    });

    // Check if token is expired (24 hours) - with better null handling
    let expiresAt: Date;
    const now = new Date();
    
    if (!assignment.confirmation_token_expires_at) {
      console.log('No expiration date set, setting to 24 hours from now');
      // If no expiration is set, update it to 24 hours from now
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Update the assignment with the proper expiration
      await this.assignmentService.updateTokenExpiration(assignment.id, expiresAt);
    } else {
      expiresAt = new Date(assignment.confirmation_token_expires_at);
    }
    
    console.log('Token expiration check:', { 
      expiresAt: expiresAt.toISOString(), 
      now: now.toISOString(),
      isExpired: now > expiresAt
    });
    
    const isExpired = now > expiresAt;
    if (isExpired) {
      console.error('Token expired:', { expiresAt, now });
    }

    return { isValid: true, isExpired };
  }

  isAlreadyResponded(assignment: AssignmentData): boolean {
    return assignment.confirmation_status === 'confirmed' || assignment.confirmation_status === 'declined';
  }
}
