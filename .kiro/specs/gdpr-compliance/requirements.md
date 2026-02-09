# Requirements Document: GDPR Compliance

## Introduction

This document specifies the requirements for implementing GDPR (General Data Protection Regulation) compliance in the Magic: The Gathering deck generator web application. The system must provide users with full control over their personal data, implement proper consent mechanisms for cookies and tracking, and ensure transparent data handling practices in accordance with EU data protection law.

The application currently stores user data including email addresses, authentication tokens, deck collections, card collections, and subscription information. GDPR compliance requires implementing user rights (access, deletion, portability), cookie consent management, privacy policies, and proper data retention mechanisms.

## Glossary

- **System**: The Magic: The Gathering deck generator web application (frontend and backend)
- **User**: Any individual who visits or registers on the application
- **Personal_Data**: Any information relating to an identified or identifiable user (email, authentication tokens, user-generated content)
- **Cookie_Consent_Manager**: The component responsible for managing user cookie preferences
- **Privacy_Policy**: The legal document describing how the System collects, uses, and protects Personal_Data
- **Terms_of_Service**: The legal document defining the rules and guidelines for using the System
- **Data_Controller**: The entity responsible for determining the purposes and means of processing Personal_Data
- **Data_Subject**: A user whose Personal_Data is being processed
- **Consent_Log**: A record of user consent decisions for cookies and data processing
- **Essential_Cookies**: Cookies strictly necessary for the System to function (authentication)
- **Analytics_Cookies**: Cookies used to collect usage statistics and improve the System
- **Marketing_Cookies**: Cookies used for advertising and marketing purposes
- **Data_Retention_Policy**: Rules defining how long Personal_Data is stored before deletion
- **Right_to_Access**: User's right to obtain confirmation of Personal_Data processing and access to that data
- **Right_to_Erasure**: User's right to request deletion of their Personal_Data ("right to be forgotten")
- **Right_to_Portability**: User's right to receive their Personal_Data in a structured, machine-readable format
- **Cache_Control_Headers**: HTTP headers that control browser and proxy caching behavior

## Requirements

### Requirement 1: Cookie Consent Management

**User Story:** As a user, I want to control which cookies the application uses, so that I can protect my privacy and comply with my preferences.

#### Acceptance Criteria

1. WHEN a user visits the System for the first time, THE Cookie_Consent_Manager SHALL display a consent banner before any non-essential cookies are set
2. WHEN displaying the consent banner, THE Cookie_Consent_Manager SHALL provide granular controls for Essential_Cookies, Analytics_Cookies, and Marketing_Cookies
3. WHEN a user accepts all cookies, THE System SHALL store the consent decision and enable all cookie categories
4. WHEN a user rejects non-essential cookies, THE System SHALL only enable Essential_Cookies
5. WHEN a user customizes cookie preferences, THE System SHALL respect the granular selections for each cookie category
6. WHEN a user changes cookie preferences, THE System SHALL update the Consent_Log with the new decision and timestamp
7. THE Cookie_Consent_Manager SHALL provide a link to detailed cookie information in the Privacy_Policy
8. WHEN a user has previously provided consent, THE Cookie_Consent_Manager SHALL not display the banner on subsequent visits
9. WHEN a user withdraws consent for a cookie category, THE System SHALL immediately stop using cookies in that category
10. THE System SHALL store consent decisions for a maximum of 12 months before requesting renewed consent

### Requirement 2: Privacy Policy Implementation

**User Story:** As a user, I want to read a clear privacy policy, so that I understand how my personal data is collected, used, and protected.

#### Acceptance Criteria

1. THE System SHALL provide a Privacy_Policy accessible from all pages via a footer link
2. THE Privacy_Policy SHALL describe what Personal_Data is collected (email, authentication tokens, deck data, collection data, subscription information)
3. THE Privacy_Policy SHALL explain the legal basis for processing Personal_Data (consent, contract performance, legitimate interest)
4. THE Privacy_Policy SHALL identify the Data_Controller with contact information
5. THE Privacy_Policy SHALL describe how long Personal_Data is retained according to the Data_Retention_Policy
6. THE Privacy_Policy SHALL explain user rights under GDPR (access, erasure, portability, objection, restriction)
7. THE Privacy_Policy SHALL describe cookie usage with categories and purposes
8. THE Privacy_Policy SHALL explain how users can exercise their rights
9. THE Privacy_Policy SHALL include the date of last update
10. WHEN the Privacy_Policy is updated, THE System SHALL notify users of material changes on their next login

### Requirement 3: Terms of Service Implementation

**User Story:** As a user, I want to understand the terms of using the application, so that I know my rights and responsibilities.

#### Acceptance Criteria

1. THE System SHALL provide Terms_of_Service accessible from all pages via a footer link
2. THE Terms_of_Service SHALL define acceptable use of the System
3. THE Terms_of_Service SHALL describe user account responsibilities
4. THE Terms_of_Service SHALL explain intellectual property rights for user-generated content
5. THE Terms_of_Service SHALL define limitation of liability
6. THE Terms_of_Service SHALL specify the governing law and jurisdiction
7. THE Terms_of_Service SHALL include the date of last update
8. WHEN a new user registers, THE System SHALL require acceptance of Terms_of_Service before account creation
9. WHEN Terms_of_Service are updated with material changes, THE System SHALL require existing users to accept the new terms on their next login

### Requirement 4: User Right to Access

**User Story:** As a user, I want to download all my personal data, so that I can see what information the application stores about me.

#### Acceptance Criteria

1. WHEN a user requests data access, THE System SHALL provide a downloadable file containing all Personal_Data
2. THE System SHALL include user account information (email, registration date, verification status, subscription details)
3. THE System SHALL include all saved decks with complete card lists
4. THE System SHALL include all card collections with card details
5. THE System SHALL include consent history from the Consent_Log
6. THE System SHALL provide data in JSON format for machine readability
7. WHEN generating the data export, THE System SHALL complete the process within 30 seconds for typical user data volumes
8. THE System SHALL require authentication before allowing data access requests
9. THE System SHALL log all data access requests with timestamp and user identification

### Requirement 5: User Right to Erasure

**User Story:** As a user, I want to delete my account and all associated data, so that I can exercise my right to be forgotten.

#### Acceptance Criteria

1. WHEN a user requests account deletion, THE System SHALL permanently delete all Personal_Data within 30 days
2. THE System SHALL delete the user account record including email and hashed password
3. THE System SHALL delete all saved decks associated with the user
4. THE System SHALL delete all card collections associated with the user
5. THE System SHALL delete all consent records from the Consent_Log
6. THE System SHALL delete all authentication tokens associated with the user
7. WHEN deleting an account, THE System SHALL require password confirmation to prevent accidental deletion
8. WHEN account deletion is initiated, THE System SHALL send a confirmation email with a cancellation link valid for 7 days
9. IF a user clicks the cancellation link within 7 days, THE System SHALL abort the deletion process
10. THE System SHALL retain minimal data required for legal compliance (transaction records for accounting) in anonymized form
11. WHEN account deletion is complete, THE System SHALL send a final confirmation email

### Requirement 6: User Right to Data Portability

**User Story:** As a user, I want to export my data in a standard format, so that I can transfer it to another service.

#### Acceptance Criteria

1. WHEN a user requests data portability, THE System SHALL provide data in JSON format
2. THE System SHALL structure exported data with clear field names and hierarchical organization
3. THE System SHALL include all deck data with card names, quantities, and metadata
4. THE System SHALL include all collection data with card details
5. THE System SHALL include user preferences and settings
6. THE System SHALL generate the export file within 30 seconds for typical user data volumes
7. THE System SHALL provide a download link valid for 24 hours
8. THE System SHALL require authentication before allowing data portability requests

### Requirement 7: Consent Logging and Audit Trail

**User Story:** As a data controller, I want to maintain records of user consent, so that I can demonstrate GDPR compliance.

#### Acceptance Criteria

1. WHEN a user provides or withdraws consent, THE System SHALL create a Consent_Log entry
2. THE Consent_Log SHALL record the user identifier
3. THE Consent_Log SHALL record the timestamp of the consent decision
4. THE Consent_Log SHALL record which cookie categories were accepted or rejected
5. THE Consent_Log SHALL record the consent banner version shown to the user
6. THE Consent_Log SHALL record the user's IP address at the time of consent
7. THE Consent_Log SHALL record the user agent string
8. THE System SHALL retain Consent_Log entries for 3 years for legal compliance
9. WHEN a user requests data access, THE System SHALL include their consent history in the export

### Requirement 8: Data Retention and Automatic Deletion

**User Story:** As a data controller, I want to automatically delete old data, so that I comply with data minimization principles.

#### Acceptance Criteria

1. THE System SHALL define retention periods for each type of Personal_Data in the Data_Retention_Policy
2. WHEN a user account is inactive for 3 years, THE System SHALL send a warning email 30 days before deletion
3. IF the user does not log in within 30 days of the warning, THE System SHALL automatically delete the account
4. THE System SHALL delete unverified accounts after 90 days of inactivity
5. THE System SHALL delete password reset tokens after 24 hours
6. THE System SHALL delete email verification tokens after 7 days
7. THE System SHALL run automated cleanup processes daily to enforce retention policies
8. THE System SHALL log all automatic deletions with timestamp and reason

### Requirement 9: Cache Control and Data Security

**User Story:** As a user, I want my personal data to be protected from unauthorized access, so that my privacy is maintained.

#### Acceptance Criteria

1. WHEN serving pages containing Personal_Data, THE System SHALL set Cache_Control_Headers to prevent caching
2. THE System SHALL set "Cache-Control: no-store, no-cache, must-revalidate, private" for authenticated API responses
3. THE System SHALL set "Pragma: no-cache" for backward compatibility
4. THE System SHALL set appropriate CORS headers to prevent unauthorized cross-origin requests
5. WHEN a user logs out, THE System SHALL invalidate all authentication tokens
6. THE System SHALL use HTTPS for all communications containing Personal_Data
7. THE System SHALL hash passwords using bcrypt with appropriate salt rounds
8. THE System SHALL not log Personal_Data in application logs except user identifiers

### Requirement 10: Cookie Management Interface

**User Story:** As a user, I want to view and modify my cookie preferences at any time, so that I maintain control over my privacy.

#### Acceptance Criteria

1. THE System SHALL provide a cookie settings page accessible from the user account menu
2. WHEN viewing cookie settings, THE System SHALL display current preferences for each cookie category
3. WHEN a user changes cookie preferences, THE System SHALL update settings immediately without requiring page reload
4. THE System SHALL display a description of each cookie category and its purpose
5. THE System SHALL display which specific cookies are used in each category
6. THE System SHALL allow users to toggle each non-essential cookie category independently
7. THE System SHALL prevent users from disabling Essential_Cookies
8. WHEN Essential_Cookies are displayed, THE System SHALL explain why they cannot be disabled

### Requirement 11: Privacy-Friendly Analytics

**User Story:** As a product owner, I want to collect usage analytics while respecting user privacy, so that I can improve the application without violating GDPR.

#### Acceptance Criteria

1. WHEN Analytics_Cookies are enabled, THE System SHALL only collect anonymized usage data
2. THE System SHALL not collect or store IP addresses in analytics data
3. THE System SHALL not track users across different websites or applications
4. THE System SHALL provide an opt-out mechanism through cookie preferences
5. WHEN a user opts out of Analytics_Cookies, THE System SHALL immediately stop collecting analytics data
6. THE System SHALL not use analytics data for purposes other than improving the application
7. THE System SHALL not share analytics data with third parties except anonymized aggregate statistics

### Requirement 12: Legal Compliance Documentation

**User Story:** As a data controller, I want to maintain documentation of GDPR compliance measures, so that I can demonstrate compliance to regulators.

#### Acceptance Criteria

1. THE System SHALL maintain a data processing register documenting all Personal_Data processing activities
2. THE System SHALL document the legal basis for each type of data processing
3. THE System SHALL document data retention periods for each data category
4. THE System SHALL document security measures protecting Personal_Data
5. THE System SHALL document procedures for handling data subject requests
6. THE System SHALL maintain records of data breaches if any occur
7. THE System SHALL document third-party data processors and their compliance status
8. THE System SHALL review and update compliance documentation annually

### Requirement 13: User Account Settings for Privacy

**User Story:** As a user, I want to manage my privacy settings in one place, so that I can easily control my data and preferences.

#### Acceptance Criteria

1. THE System SHALL provide a privacy settings section in the user account page
2. THE privacy settings SHALL include a link to download all Personal_Data
3. THE privacy settings SHALL include a button to request account deletion
4. THE privacy settings SHALL include a link to cookie preferences
5. THE privacy settings SHALL display the current consent status for each cookie category
6. THE privacy settings SHALL display the date of last Privacy_Policy acceptance
7. THE privacy settings SHALL allow users to review and re-accept updated policies
8. THE privacy settings SHALL display data retention information for the user's account

### Requirement 14: Email Communication Preferences

**User Story:** As a user, I want to control what emails I receive, so that I only get communications I'm interested in.

#### Acceptance Criteria

1. THE System SHALL provide email preference controls in user account settings
2. THE System SHALL allow users to opt out of marketing emails while maintaining essential notifications
3. WHEN a user opts out of marketing emails, THE System SHALL honor the preference immediately
4. THE System SHALL always send essential emails (password reset, account deletion confirmation) regardless of preferences
5. THE System SHALL include an unsubscribe link in all marketing emails
6. WHEN a user clicks an unsubscribe link, THE System SHALL update preferences without requiring login
7. THE System SHALL confirm email preference changes with a notification

### Requirement 15: Data Breach Notification

**User Story:** As a user, I want to be notified if my data is compromised, so that I can take protective measures.

#### Acceptance Criteria

1. IF a data breach occurs affecting Personal_Data, THE System SHALL notify affected users within 72 hours
2. THE notification SHALL describe the nature of the breach
3. THE notification SHALL describe what Personal_Data was affected
4. THE notification SHALL provide recommendations for protective measures
5. THE notification SHALL include contact information for questions
6. THE System SHALL notify the relevant data protection authority within 72 hours of breach discovery
7. THE System SHALL maintain a record of the breach, its effects, and remedial actions taken

