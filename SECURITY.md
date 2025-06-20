# Security Documentation

## Overview
This document outlines the security measures implemented in the Docu Event Nexus application to protect against common vulnerabilities and ensure data integrity.

## Environment Variables

### Required Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Supabase Edge Functions (set in Supabase dashboard)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SITE_URL=https://your-production-domain.com
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### Security Notes
- Never commit `.env` files to version control
- Use different keys for development, staging, and production
- Rotate keys regularly
- Use Gmail App Passwords instead of regular passwords for email functionality

## Authentication & Authorization

### Row Level Security (RLS)
All database tables have RLS enabled with granular policies:

#### Events Table
- **SELECT**: Users can view events they created or are assigned to
- **INSERT**: Users can only create events for themselves
- **UPDATE**: Users can only update their own events
- **DELETE**: Users can only delete their own events

#### Staff Members Table
- **SELECT**: Users can view staff they created or staff assigned to their events
- **INSERT**: Users can only create staff for themselves
- **UPDATE**: Users can only update their own staff
- **DELETE**: Users can only delete their own staff

#### Staff Assignments Table
- **SELECT**: Users can view assignments for events they created or are assigned to
- **INSERT**: Users can create assignments for their events
- **UPDATE**: Users can update assignments for their events
- **DELETE**: Users can delete assignments for their events

#### Schedules Table
- **ALL**: Users can only access their own schedules

#### Notifications Table
- **ALL**: Users can only access their own notifications

## API Security

### CORS Configuration
Edge Functions are configured with restrictive CORS policies:
- Only allows requests from specified origins
- Supports development and production domains
- Prevents cross-origin attacks

### Rate Limiting
Edge Functions implement rate limiting to prevent abuse:
- **Confirmation Handler**: 10 requests per minute per IP
- **Email Function**: 5 requests per minute per IP (more restrictive)
- Automatic cleanup of expired rate limit records

### Input Validation
All user inputs are validated using Zod schemas:
- Email validation with proper format checking
- Password strength requirements (8+ chars, uppercase, lowercase, number)
- Event data validation with time range checking
- Staff data validation with role requirements
- UUID validation for database IDs

## Data Protection

### Encryption
- All data in transit is encrypted using HTTPS
- Supabase provides automatic encryption at rest
- Passwords are hashed using Supabase Auth

### Data Sanitization
- All user inputs are sanitized before database operations
- SQL injection protection through Supabase's parameterized queries
- XSS protection through proper input validation

## Deployment Security

### Vercel Configuration
- Environment variables stored securely in Vercel dashboard
- Automatic HTTPS enforcement
- Security headers configured

### Supabase Configuration
- Database access restricted through RLS policies
- Service role key only used in secure Edge Functions
- Public key safe for client-side use

## Security Best Practices

### Code Security
1. **Dependencies**: Regularly update dependencies and run security audits
2. **Secrets**: Never hardcode secrets in source code
3. **Validation**: Always validate and sanitize user inputs
4. **Authorization**: Check permissions at every level

### Operational Security
1. **Monitoring**: Monitor for unusual activity patterns
2. **Backups**: Regular database backups
3. **Updates**: Keep all dependencies updated
4. **Access Control**: Limit access to production environments

### User Security
1. **Password Policy**: Enforce strong password requirements
2. **Session Management**: Secure session handling
3. **Email Verification**: Require email verification for new accounts
4. **Rate Limiting**: Prevent brute force attacks

## Vulnerability Response

### Reporting Security Issues
If you discover a security vulnerability, please:
1. Do not publicly disclose the issue
2. Contact the development team immediately
3. Provide detailed information about the vulnerability
4. Allow time for assessment and remediation

### Incident Response
1. **Assessment**: Evaluate the scope and impact
2. **Containment**: Prevent further exploitation
3. **Remediation**: Fix the vulnerability
4. **Communication**: Notify affected users if necessary
5. **Review**: Analyze the incident and improve security measures

## Compliance

### Data Protection
- User data is processed in accordance with privacy regulations
- Data retention policies are enforced
- Users have control over their personal information

### Audit Trail
- All database operations are logged
- User actions are tracked for security monitoring
- Access logs are maintained for compliance

## Security Checklist

### Before Deployment
- [ ] All environment variables configured
- [ ] RLS policies applied to database
- [ ] CORS settings configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Security headers configured
- [ ] Dependencies updated and audited

### Regular Maintenance
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Annual penetration testing
- [ ] Regular backup verification
- [ ] Access control reviews

## Contact

For security-related questions or concerns, please contact the development team through the appropriate channels. 