# Implementation Plan: GDPR Compliance

## Overview

This implementation plan breaks down the GDPR compliance feature into discrete coding tasks. The implementation follows a layered approach: database models first, backend services and API endpoints, then frontend components. Each major component includes property-based tests to verify correctness properties from the design document.

The implementation prioritizes core functionality (cookie consent, data export, account deletion) before secondary features (email preferences, analytics). Testing tasks are marked as optional with `*` to allow for faster MVP delivery while maintaining the option for comprehensive testing.

## Tasks

- [x] 1. Set up database models and migrations for GDPR compliance
  - [x] 1.1 Create ConsentLog model and migration
    - Add ConsentLog table with fields: id, user_id, session_id, essential, analytics, marketing, timestamp, ip_address, user_agent, banner_version, expires_at
    - Create database migration script
    - _Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [x] 1.2 Create DeletionRequest model and migration
    - Add DeletionRequest table with fields: id, user_id, requested_at, scheduled_for, cancellation_token, status, cancelled_at, completed_at
    - Create database migration script
    - _Requirements: 5.8, 5.9_
  
  - [x] 1.3 Create DataExportToken model and migration
    - Add DataExportToken table with fields: id, user_id, token, file_path, file_size_bytes, created_at, expires_at
    - Create database migration script
    - _Requirements: 4.1, 6.7_
  
  - [x] 1.4 Create PolicyAcceptance model and migration
    - Add PolicyAcceptance table with fields: id, user_id, policy_type, policy_version, accepted_at
    - Add index on (user_id, policy_type, policy_version)
    - Create database migration script
    - _Requirements: 2.10, 3.8, 3.9_
  
  - [x] 1.5 Extend User model with GDPR fields
    - Add fields: last_login_at, inactive_warning_sent_at, privacy_policy_version, terms_version, marketing_emails_enabled
    - Create database migration script
    - _Requirements: 8.2, 14.2_

- [x] 2. Implement backend ConsentService
  - [x] 2.1 Implement log_consent method
    - Create ConsentLog entry with all required fields
    - Set expires_at to 12 months from timestamp
    - Handle both authenticated users (user_id) and anonymous users (session_id)
    - _Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 2.2 Write property test for consent logging completeness
    - **Property 2: Consent Logging Completeness**
    - Generate random consent decisions and verify all fields are logged
    - **Validates: Requirements 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
  
  - [x] 2.3 Implement get_user_consent_history method
    - Query all ConsentLog entries for a user ordered by timestamp descending
    - Return list of consent decisions
    - _Requirements: 4.5, 7.9_
  
  - [x] 2.4 Implement get_current_consent method
    - Query most recent non-expired ConsentLog for user or session
    - Return None if no consent found or consent expired
    - _Requirements: 1.8_
  
  - [ ]* 2.5 Write property test for consent retrieval
    - **Property 1: Consent Decision Persistence**
    - Generate random consent, store it, retrieve it, verify it matches
    - **Validates: Requirements 1.3, 1.4, 1.5**
  
  - [x] 2.6 Implement cleanup_old_consents method
    - Delete ConsentLog entries older than 3 years
    - Return count of deleted records
    - _Requirements: 7.8_

- [ ] 3. Implement backend DataExportService
  - [x] 3.1 Implement export_user_data method
    - Query user account information
    - Query all saved decks with cards
    - Query all card collections with cards
    - Query consent history
    - Query policy acceptances
    - Structure data according to export format in design
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 3.2 Write property test for export completeness
    - **Property 7: Data Export Completeness**
    - Generate random user with decks/collections, export data, verify all present
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 6.2, 6.3, 6.4, 6.5**
  
  - [x] 3.3 Implement generate_export_file method
    - Call export_user_data to get data dictionary
    - Convert to JSON and write to temporary file
    - Generate secure random token
    - Create DataExportToken record with 24-hour expiry
    - Return download token
    - _Requirements: 4.6, 6.1, 6.7_
  
  - [ ]* 3.4 Write property test for JSON format validity
    - **Property 8: Export Format Validity**
    - Generate random user data, export to JSON, parse JSON, verify valid structure
    - **Validates: Requirements 4.6, 6.1**
  
  - [x] 3.5 Implement get_export_file method
    - Query DataExportToken by token
    - Check if token expired (raise TokenExpiredException if expired)
    - Read file from file_path
    - Return file content and filename
    - _Requirements: 6.7_

- [x] 4. Implement backend DeletionService
  - [x] 4.1 Implement initiate_deletion method
    - Verify password using bcrypt
    - Check if deletion already pending (raise exception if yes)
    - Generate secure cancellation token
    - Create DeletionRequest with scheduled_for = now + 7 days
    - Send confirmation email with cancellation link
    - _Requirements: 5.7, 5.8_
  
  - [ ]* 4.2 Write property test for password verification
    - **Property 12: Deletion Password Verification**
    - Generate random users with passwords, attempt deletion with wrong password, verify rejection
    - **Validates: Requirements 5.7**
  
  - [x] 4.3 Implement cancel_deletion method
    - Query DeletionRequest by cancellation_token
    - Check if token valid and not expired
    - Update status to 'cancelled' and set cancelled_at
    - Return True if successful, False if invalid
    - _Requirements: 5.9_
  
  - [ ]* 4.4 Write property test for deletion cancellation
    - **Property 13: Deletion Grace Period**
    - Generate random deletion requests, cancel them, verify deletion aborted
    - **Validates: Requirements 5.8, 5.9**
  
  - [x] 4.5 Implement execute_deletion method
    - Delete all SavedDeck records for user
    - Delete all SavedDeckCard records for user's decks
    - Delete all CardCollection records for user
    - Delete all Card records for user
    - Delete all ConsentLog records for user
    - Delete all PolicyAcceptance records for user
    - Delete all DataExportToken records for user
    - Delete User record
    - Send final confirmation email
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.11_
  
  - [ ]* 4.6 Write property test for deletion completeness
    - **Property 11: Account Deletion Completeness**
    - Generate random user with data, execute deletion, verify all data removed
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
  
  - [x] 4.7 Implement process_pending_deletions method
    - Query DeletionRequest records with status='pending' and scheduled_for <= now
    - For each request, call execute_deletion
    - Update DeletionRequest status to 'completed'
    - Return count of deletions processed
    - _Requirements: 5.1_

- [x] 5. Implement backend RetentionService
  - [x] 5.1 Implement cleanup_inactive_accounts method
    - Query users with last_login_at > 3 years ago and inactive_warning_sent_at is NULL
    - Send warning emails and set inactive_warning_sent_at
    - Query users with inactive_warning_sent_at > 30 days ago
    - Delete those accounts using DeletionService.execute_deletion
    - Return count of accounts deleted
    - _Requirements: 8.2, 8.3_
  
  - [ ]* 5.2 Write property test for inactive account cleanup
    - **Property 15: Inactive Account Cleanup**
    - Generate users with old last_login dates, run cleanup, verify warnings sent and deletions occur
    - **Validates: Requirements 8.2, 8.3**
  
  - [x] 5.3 Implement cleanup_unverified_accounts method
    - Query users with is_verified=False and created_at > 90 days ago
    - Delete those accounts
    - Return count of accounts deleted
    - _Requirements: 8.4_
  
  - [ ]* 5.4 Write property test for unverified account cleanup
    - **Property 16: Unverified Account Cleanup**
    - Generate unverified users with old creation dates, run cleanup, verify deletion
    - **Validates: Requirements 8.4**
  
  - [x] 5.5 Implement cleanup_expired_tokens method
    - Delete password reset tokens older than 24 hours
    - Delete email verification tokens older than 7 days
    - Return count of tokens deleted
    - _Requirements: 8.5, 8.6_
  
  - [x] 5.6 Implement run_all_cleanup_tasks method
    - Call cleanup_inactive_accounts
    - Call cleanup_unverified_accounts
    - Call cleanup_expired_tokens
    - Call ConsentService.cleanup_old_consents
    - Return summary dictionary with counts
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 7.8_
  
  - [ ]* 5.7 Write property test for automatic deletion logging
    - **Property 17: Automatic Deletion Audit Logging**
    - Generate accounts for cleanup, run cleanup, verify log entries created
    - **Validates: Requirements 8.8**

- [x] 6. Implement GDPR API endpoints
  - [x] 6.1 Create GDPR router and implement POST /api/gdpr/consent
    - Accept consent decision in request body
    - Extract IP address and user agent from request
    - Call ConsentService.log_consent
    - Return success response with consent_id and timestamp
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [ ]* 6.2 Write property test for consent endpoint
    - **Property 2: Consent Logging Completeness**
    - Generate random consent requests, POST to endpoint, verify log entries complete
    - **Validates: Requirements 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
  
  - [x] 6.3 Implement GET /api/gdpr/consent
    - Require authentication
    - Call ConsentService.get_current_consent
    - Call ConsentService.get_user_consent_history
    - Return current consent and history
    - _Requirements: 4.5, 7.9_
  
  - [x] 6.4 Implement POST /api/gdpr/export
    - Require authentication
    - Call DataExportService.generate_export_file
    - Log data access request
    - Return download URL with expiry time
    - _Requirements: 4.1, 4.9_
  
  - [ ]* 6.5 Write property test for authentication requirement
    - **Property 9: Authentication Required for Data Operations**
    - Generate requests without auth tokens, verify rejection
    - **Validates: Requirements 4.8, 6.8**
  
  - [ ]* 6.6 Write property test for data access logging
    - **Property 10: Data Access Audit Logging**
    - Generate authenticated export requests, verify log entries created
    - **Validates: Requirements 4.9**
  
  - [x] 6.7 Implement GET /api/gdpr/download/:token
    - Call DataExportService.get_export_file
    - Set Content-Disposition header for download
    - Return file as JSON response
    - Handle TokenExpiredException
    - _Requirements: 6.7_
  
  - [x] 6.8 Implement POST /api/gdpr/delete-account
    - Require authentication
    - Extract password and confirmation from request
    - Verify confirmation text matches "DELETE MY ACCOUNT"
    - Call DeletionService.initiate_deletion
    - Return success response with cancellation token
    - _Requirements: 5.7, 5.8_
  
  - [x] 6.9 Implement POST /api/gdpr/cancel-deletion
    - Extract cancellation_token from request
    - Call DeletionService.cancel_deletion
    - Return success or error response
    - _Requirements: 5.9_
  
  - [x] 6.10 Implement GET /api/gdpr/privacy-policy
    - Read privacy policy markdown file
    - Return content with version and last updated date
    - _Requirements: 2.1_
  
  - [x] 6.11 Implement GET /api/gdpr/terms-of-service
    - Read terms of service markdown file
    - Return content with version and last updated date
    - _Requirements: 3.1_
  
  - [x] 6.12 Implement POST /api/gdpr/accept-policy
    - Require authentication
    - Extract policy_type and version from request
    - Create PolicyAcceptance record
    - Update User.privacy_policy_version or User.terms_version
    - Return success response
    - _Requirements: 2.10, 3.8, 3.9_

- [x] 7. Implement cache control and security middleware
  - [x] 7.1 Create CacheControlMiddleware
    - Check if request is authenticated (has valid JWT)
    - For authenticated requests, set cache control headers
    - Set "Cache-Control: no-store, no-cache, must-revalidate, private"
    - Set "Pragma: no-cache"
    - Set "Expires: 0"
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 7.2 Write property test for cache control headers
    - **Property 18: Cache Control Headers for Personal Data**
    - Generate authenticated requests, verify headers set correctly
    - **Validates: Requirements 9.1, 9.2, 9.3**
  
  - [x] 7.3 Update CORS middleware configuration
    - Add expose_headers for Content-Disposition
    - Verify allow_credentials is True
    - Verify allowed origins are correct
    - _Requirements: 9.4_
  
  - [ ]* 7.4 Write property test for CORS protection
    - **Property 19: CORS Protection**
    - Generate requests from unauthorized origins, verify rejection
    - **Validates: Requirements 9.4**
  
  - [x] 7.5 Implement token invalidation on logout
    - Add logout endpoint to auth router
    - Delete or mark authentication token as invalid
    - _Requirements: 9.5_
  
  - [ ]* 7.6 Write property test for token invalidation
    - **Property 20: Token Invalidation on Logout**
    - Generate user sessions, logout, verify tokens no longer work
    - **Validates: Requirements 9.5**

- [x] 8. Create legal document content
  - [x] 8.1 Write Privacy Policy markdown content
    - Include all required sections from requirements 2.2-2.9
    - Describe data collection practices
    - Explain legal basis for processing
    - List user rights under GDPR
    - Describe cookie usage
    - Include contact information
    - Add version number and last updated date
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_
  
  - [x] 8.2 Write Terms of Service markdown content
    - Include all required sections from requirements 3.2-3.7
    - Define acceptable use
    - Describe account responsibilities
    - Explain intellectual property rights
    - Define limitation of liability
    - Specify governing law
    - Add version number and last updated date
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 9. Checkpoint - Ensure backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 10. Implement frontend CookieConsentBanner component
  - [x] 10.1 Create CookieConsentBanner React component
    - Create component with state for showBanner, showDetails, consent
    - Implement loadStoredConsent method to check localStorage
    - Display banner if no consent found or consent expired
    - Provide buttons for "Accept All", "Reject Non-Essential", "Customize"
    - Include link to Privacy Policy
    - _Requirements: 1.1, 1.2, 1.7_
  
  - [ ]* 10.2 Write unit test for banner display logic
    - Test banner shows on first visit
    - Test banner hidden when consent exists
    - Test banner shows when consent expired
    - _Requirements: 1.1, 1.8_
  
  - [x] 10.3 Implement acceptAll method
    - Set consent to {essential: true, analytics: true, marketing: true}
    - Call saveConsent
    - Hide banner
    - _Requirements: 1.3_
  
  - [x] 10.4 Implement rejectNonEssential method
    - Set consent to {essential: true, analytics: false, marketing: false}
    - Call saveConsent
    - Hide banner
    - _Requirements: 1.4_
  
  - [x] 10.5 Implement saveCustomPreferences method
    - Get consent from state
    - Call saveConsent
    - Hide banner
    - _Requirements: 1.5_
  
  - [x] 10.6 Implement saveConsent method
    - Store consent in localStorage with 12-month expiry
    - POST consent to /api/gdpr/consent
    - Call onConsentChange callback
    - Enable/disable cookie categories based on consent
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.10_
  
  - [ ]* 10.7 Write property test for consent persistence
    - **Property 1: Consent Decision Persistence**
    - Generate random consent decisions, save them, reload component, verify persistence
    - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 11. Implement frontend PrivacySettings component
  - [x] 11.1 Create PrivacySettings React component
    - Create component with state for cookiePreferences, exportStatus, deletionStatus
    - Fetch current consent from GET /api/gdpr/consent
    - Display current cookie preferences
    - Display policy acceptance dates
    - Provide buttons for data export and account deletion
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 11.2 Implement updateCookiePreferences method
    - POST updated consent to /api/gdpr/consent
    - Update localStorage
    - Update component state
    - Show success message
    - _Requirements: 1.6, 10.3_
  
  - [ ]* 11.3 Write property test for immediate preference updates
    - **Property 24: Immediate Preference Updates**
    - Generate preference changes, verify updates without reload
    - **Validates: Requirements 10.3**
  
  - [x] 11.4 Implement requestDataExport method
    - Set exportStatus to 'generating'
    - POST to /api/gdpr/export
    - Get download URL from response
    - Set exportStatus to 'ready'
    - Initiate file download
    - _Requirements: 4.1, 6.1_
  
  - [x] 11.5 Implement requestAccountDeletion method
    - Show password confirmation dialog
    - POST to /api/gdpr/delete-account with password
    - Show success message with grace period information
    - Set deletionStatus to 'pending'
    - _Requirements: 5.7, 5.8_
  
  - [x] 11.6 Implement cancelDeletion method
    - POST to /api/gdpr/cancel-deletion with token
    - Show success message
    - Set deletionStatus to 'idle'
    - _Requirements: 5.9_

- [x] 12. Implement frontend LegalPages component
  - [x] 12.1 Create LegalPages React component
    - Create component with props for pageType ('privacy' | 'terms')
    - Fetch content from appropriate endpoint
    - Display markdown content
    - Show last updated date
    - Show version number
    - _Requirements: 2.1, 3.1_
  
  - [x] 12.2 Implement loadContent method
    - GET from /api/gdpr/privacy-policy or /api/gdpr/terms-of-service
    - Parse markdown to HTML
    - Set content state
    - _Requirements: 2.1, 3.1_
  
  - [x] 12.3 Implement checkForUpdates method
    - Compare user's accepted version with current version
    - If different, show acceptance dialog
    - _Requirements: 2.10, 3.9_
  
  - [ ]* 12.4 Write property test for policy update notification
    - **Property 5: Policy Update Notification**
    - Generate users with old policy versions, verify notification shown
    - **Validates: Requirements 2.10, 3.9**
  
  - [x] 12.4 Implement acceptPolicy method
    - POST to /api/gdpr/accept-policy
    - Update user's accepted version
    - Hide acceptance dialog
    - _Requirements: 2.10, 3.8, 3.9_

- [x] 13. Implement frontend DataExportButton component
  - [x] 13.1 Create DataExportButton React component
    - Create button with loading state
    - Implement initiateExport method
    - POST to /api/gdpr/export
    - Get download URL
    - Call downloadFile method
    - _Requirements: 4.1_
  
  - [x] 13.2 Implement downloadFile method
    - Create temporary anchor element
    - Set href to download URL
    - Set download attribute
    - Trigger click
    - Call onExportComplete callback
    - _Requirements: 4.1_

- [x] 14. Implement frontend AccountDeletionFlow component
  - [x] 14.1 Create AccountDeletionFlow React component
    - Create multi-step flow with state management
    - Step 1: Confirmation warning
    - Step 2: Password input
    - Step 3: Pending status display
    - _Requirements: 5.7, 5.8_
  
  - [x] 14.2 Implement confirmDeletion method
    - Show password confirmation step
    - Display warning about data loss
    - _Requirements: 5.7_
  
  - [x] 14.3 Implement submitDeletion method
    - POST to /api/gdpr/delete-account with password
    - Handle success: show pending status
    - Handle error: show error message
    - _Requirements: 5.7, 5.8_
  
  - [x] 14.4 Implement cancelDeletion method
    - Reset flow to initial state
    - Clear password input
    - _Requirements: 5.9_

- [x] 15. Implement cookie management interface
  - [x] 15.1 Create CookieSettings page component
    - Display current preferences for each cookie category
    - Show description of each category
    - Show list of specific cookies in each category
    - Provide toggle switches for non-essential categories
    - Disable toggle for essential cookies with explanation
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.7, 10.8_
  
  - [ ]* 15.2 Write property test for cookie category independence
    - **Property 25: Cookie Category Independence**
    - Generate random category toggles, verify independence
    - **Validates: Requirements 10.6**
  
  - [ ]* 15.3 Write property test for essential cookie protection
    - **Property 26: Essential Cookie Protection**
    - Attempt to disable essential cookies, verify prevention
    - **Validates: Requirements 10.7**
  
  - [x] 15.4 Implement cookie preference update handler
    - POST updated preferences to /api/gdpr/consent
    - Update localStorage
    - Show success message
    - _Requirements: 10.3, 10.6_

- [x] 16. Implement email preference controls
  - [x] 16.1 Add email preferences section to user settings
    - Add toggle for marketing emails
    - Display current preference
    - Show explanation of essential vs marketing emails
    - _Requirements: 14.1_
  
  - [x] 16.2 Implement email preference update handler
    - Update User.marketing_emails_enabled in database
    - Show confirmation message
    - _Requirements: 14.2, 14.3_
  
  - [ ]* 16.3 Write property test for email preference enforcement
    - **Property 31: Email Preference Enforcement**
    - Generate users with opt-out, verify no marketing emails sent
    - **Validates: Requirements 14.2, 14.3, 14.4**
  
  - [x] 16.4 Update email sending logic to check preferences
    - Before sending marketing email, check User.marketing_emails_enabled
    - Always send essential emails regardless of preference
    - _Requirements: 14.2, 14.4_
  
  - [x] 16.5 Add unsubscribe link to marketing emails
    - Generate unsubscribe token for each marketing email
    - Include link in email template
    - _Requirements: 14.5_
  
  - [ ]* 16.6 Write property test for unsubscribe link presence
    - **Property 32: Marketing Email Unsubscribe Link**
    - Generate marketing emails, verify unsubscribe link present
    - **Validates: Requirements 14.5**
  
  - [x] 16.7 Implement unsubscribe endpoint
    - Create GET /api/gdpr/unsubscribe/:token endpoint
    - Verify token and update User.marketing_emails_enabled
    - Show confirmation page
    - _Requirements: 14.6_
  
  - [ ]* 16.8 Write property test for unsubscribe without login
    - **Property 33: Unsubscribe Without Login**
    - Generate unsubscribe tokens, verify preference update without auth
    - **Validates: Requirements 14.6**

- [x] 17. Integrate GDPR components into main application
  - [x] 17.1 Add CookieConsentBanner to App.jsx
    - Import and render CookieConsentBanner at root level
    - Pass onConsentChange handler
    - _Requirements: 1.1_
  
  - [x] 17.2 Add footer with legal links to all pages
    - Create Footer component
    - Add links to Privacy Policy and Terms of Service
    - Add link to Cookie Settings
    - Render footer on all pages
    - _Requirements: 2.1, 3.1_
  
  - [x] 17.3 Add privacy settings to user account page
    - Import PrivacySettings component
    - Add privacy settings tab or section
    - _Requirements: 13.1_
  
  - [x] 17.4 Add policy acceptance check to registration flow
    - Add checkbox for Terms of Service acceptance
    - Prevent registration if not checked
    - Record acceptance in PolicyAcceptance table
    - _Requirements: 3.8_
  
  - [ ]* 17.5 Write property test for terms acceptance requirement
    - **Property 6: Terms Acceptance Requirement**
    - Generate registration attempts without acceptance, verify rejection
    - **Validates: Requirements 3.8**
  
  - [x] 17.6 Add policy update check to login flow
    - After successful login, check if user's policy versions are current
    - If outdated, show policy acceptance modal
    - Prevent access until policies accepted
    - _Requirements: 2.10, 3.9_

- [x] 18. Implement background job for retention policies
  - [x] 18.1 Create scheduled task for retention cleanup
    - Create Python script that calls RetentionService.run_all_cleanup_tasks
    - Set up cron job or scheduler to run daily
    - Log results of cleanup operations
    - _Requirements: 8.7_
  
  - [x] 18.2 Create scheduled task for pending deletions
    - Create Python script that calls DeletionService.process_pending_deletions
    - Set up cron job or scheduler to run daily
    - Log results of deletion operations
    - _Requirements: 5.1_
  
  - [x] 18.3 Create scheduled task for export token cleanup
    - Delete expired DataExportToken records
    - Delete associated export files
    - _Requirements: 6.7_

- [x] 19. Add logging and monitoring
  - [x] 19.1 Implement audit logging for GDPR operations
    - Log all consent changes
    - Log all data export requests
    - Log all account deletion requests
    - Log all automatic deletions
    - Ensure logs don't contain PII except user IDs
    - _Requirements: 4.9, 8.8, 9.8_
  
  - [ ]* 19.2 Write property test for PII exclusion from logs
    - **Property 22: PII Exclusion from Logs**
    - Generate log entries, verify no PII present
    - **Validates: Requirements 9.8**
  
  - [x] 19.3 Create monitoring dashboard for GDPR metrics
    - Track consent acceptance rates
    - Track data export requests
    - Track account deletion requests
    - Track retention cleanup statistics
    - _Requirements: 12.1_

- [x] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Background jobs should be implemented with proper error handling and retry logic
- All email sending should be asynchronous to avoid blocking API responses
- Export files should be stored in a temporary directory with automatic cleanup
- Consent decisions should be stored in localStorage with proper expiry handling
- All API endpoints should include proper error handling and validation
