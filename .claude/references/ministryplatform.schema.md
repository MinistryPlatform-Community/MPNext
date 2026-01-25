# Ministry Platform Schema Reference

This document provides a summary of Ministry Platform database tables for LLM assistants working on the MPNext project.

**Generated:** 2026-01-25T00:52:33.294Z
**Tables:** 301

---

### _Deployments

Access: Read | Permissions: None

- **Primary Key:** `Deployment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Deployments.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DeploymentsSchema.ts`

### Account_Types

Access: Read | Permissions: None

- **Primary Key:** `Account_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AccountTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AccountTypesSchema.ts`

### Accounting_Companies

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Accounting_Company_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AccountingCompanies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AccountingCompaniesSchema.ts`
- **Foreign Keys:**
  - `Company_Contact_ID` -> `Contacts.Contact_ID`
  - `Default_Congregation` -> `Congregations.Congregation_ID`
  - `Pledge_Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`
  - `Alternate_Pledge_Campaign` -> `Pledge_Campaigns.Pledge_Campaign_ID`
  - `Statement_Cutoff_Automation_ID` -> `Statement_Cutoff_Automation.Statement_Cutoff_Automation_ID`
  - `Standard_Statement` -> `dp_Reports.Report_ID`

### Activity_Log

Access: ReadWrite | Permissions: DataExport

- **Primary Key:** `Activity_Log_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ActivityLog.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ActivityLogSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Household_ID` -> `Households.Household_ID`
  - `Page_ID` -> `dp_Pages.Page_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Ministry_ID` -> `Ministries.Ministry_ID`

### Activity_Log_Staging

Access: Read | Permissions: None

- **Primary Key:** `Activity_Log_Staging_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ActivityLogStaging.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ActivityLogStagingSchema.ts`

### Addresses

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Address_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Addresses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AddressesSchema.ts`

### Alternate_Email_Types

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Alternate_Email_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AlternateEmailTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AlternateEmailTypesSchema.ts`

### Alternate_Emails

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Alternate_Email_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AlternateEmails.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AlternateEmailsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Alternate_Email_Type_ID` -> `Alternate_Email_Types.Alternate_Email_Type_ID`

### Assignment_Roles

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Assignment_Role_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AssignmentRoles.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AssignmentRolesSchema.ts`

### Attribute_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Attribute_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AttributeTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AttributeTypesSchema.ts`

### Attributes

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Attribute_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Attributes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AttributesSchema.ts`
- **Foreign Keys:**
  - `Attribute_Type_ID` -> `Attribute_Types.Attribute_Type_ID`

### Audience_Audience_Filters

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Audience_Audience_Filter_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AudienceAudienceFilters.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AudienceAudienceFiltersSchema.ts`
- **Foreign Keys:**
  - `Audience_ID` -> `Audiences.Audience_ID`
  - `Filter_ID` -> `Audience_Filters.Filter_ID`
  - `Operator_ID` -> `Audience_Operators.Operator_ID`

### Audience_Filters

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Filter_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AudienceFilters.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AudienceFiltersSchema.ts`

### Audience_Members

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Audience_Member_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AudienceMembers.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AudienceMembersSchema.ts`
- **Foreign Keys:**
  - `Audience_ID` -> `Audiences.Audience_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### Audience_Members_Staging

Access: Read | Permissions: None

- **Primary Key:** `Contact_Id`
- **Type:** `src/lib/providers/ministry-platform/models/AudienceMembersStaging.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AudienceMembersStagingSchema.ts`

### Audience_Operators

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Operator_ID`
- **Type:** `src/lib/providers/ministry-platform/models/AudienceOperators.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AudienceOperatorsSchema.ts`

### Audiences

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Audience_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Audiences.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AudiencesSchema.ts`

### Background_Check_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Background_Check_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BackgroundCheckStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BackgroundCheckStatusesSchema.ts`

### Background_Check_Types

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Background_Check_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BackgroundCheckTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BackgroundCheckTypesSchema.ts`

### Background_Checks

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Background_Check_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BackgroundChecks.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BackgroundChecksSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Requesting_Ministry` -> `Ministries.Ministry_ID`
  - `Background_Check_Type_ID` -> `Background_Check_Types.Background_Check_Type_ID`
  - `Background_Check_Status_ID` -> `Background_Check_Statuses.Background_Check_Status_ID`

### Banks

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Bank_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Banks.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BanksSchema.ts`
- **Foreign Keys:**
  - `Accounting_Company_ID` -> `Accounting_Companies.Accounting_Company_ID`
  - `Address_ID` -> `Addresses.Address_ID`

### Batch_Entry_Types

Access: Read | Permissions: None

- **Primary Key:** `Batch_Entry_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BatchEntryTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BatchEntryTypesSchema.ts`

### Batch_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Batch_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BatchTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BatchTypesSchema.ts`

### Batch_Usage_Types

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Batch_Usage_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BatchUsageTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BatchUsageTypesSchema.ts`

### Batches

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Batch_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Batches.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BatchesSchema.ts`
- **Foreign Keys:**
  - `Batch_Entry_Type_ID` -> `Batch_Entry_Types.Batch_Entry_Type_ID`
  - `Batch_Type_ID` -> `Batch_Types.Batch_Type_ID`
  - `Default_Program` -> `Programs.Program_ID`
  - `Source_Event` -> `Events.Event_ID`
  - `Deposit_ID` -> `Deposits.Deposit_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Default_Payment_Type` -> `Payment_Types.Payment_Type_ID`
  - `Operator_User` -> `dp_Users.User_ID`
  - `Batch_Usage_Type_ID` -> `Batch_Usage_Types.Batch_Usage_Type_ID`
  - `Pledge_Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`

### Beneficiary_Relationships

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Beneficiary_Relationship_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BeneficiaryRelationships.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BeneficiaryRelationshipsSchema.ts`

### Benefit_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Benefit_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BenefitTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BenefitTypesSchema.ts`

### Book_Checkouts

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Book_Checkout_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BookCheckouts.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BookCheckoutsSchema.ts`
- **Foreign Keys:**
  - `Book_Checkout_ID` -> `Book_Checkouts.Book_Checkout_ID`
  - `Book_ID` -> `Books.Book_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### Books

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Book_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Books.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BooksSchema.ts`
- **Foreign Keys:**
  - `Genre_ID` -> `Genres.Genre_ID`

### Buildings

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Building_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Buildings.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BuildingsSchema.ts`
- **Foreign Keys:**
  - `Location_ID` -> `Locations.Location_ID`
  - `Building_Coordinator` -> `Contacts.Contact_ID`

### Campaign_Goals

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Campaign_Goal_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CampaignGoals.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CampaignGoalsSchema.ts`
- **Foreign Keys:**
  - `Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Care_Case_Types

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Care_Case_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CareCaseTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CareCaseTypesSchema.ts`

### Care_Cases

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Care_Case_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CareCases.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CareCasesSchema.ts`
- **Foreign Keys:**
  - `Household_ID` -> `Households.Household_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Care_Case_Type_ID` -> `Care_Case_Types.Care_Case_Type_ID`
  - `Location_ID` -> `Locations.Location_ID`
  - `Case_Manager` -> `dp_Users.User_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Care_Outcomes

Access: Read | Permissions: None

- **Primary Key:** `Care_Outcome_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CareOutcomes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CareOutcomesSchema.ts`

### Care_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Care_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CareTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CareTypesSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`

### Certification_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Certification_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CertificationTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CertificationTypesSchema.ts`

### Chart_Colors

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Chart_Color_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ChartColors.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ChartColorsSchema.ts`

### Checkin_Search_Results_Types

Access: Read | Permissions: None

- **Primary Key:** `Checkin_Search_Results_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CheckinSearchResultsTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CheckinSearchResultsTypesSchema.ts`

### Church_Associations

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Church_Association_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ChurchAssociations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ChurchAssociationsSchema.ts`
- **Foreign Keys:**
  - `Address_ID` -> `Addresses.Address_ID`

### Citizenship_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Citizenship_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CitizenshipTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CitizenshipTypesSchema.ts`

### Congregation_Audits

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Congregation_Audit_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CongregationAudits.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CongregationAuditsSchema.ts`
- **Foreign Keys:**
  - `Household_ID` -> `Households.Household_ID`
  - `Prior_Congregation` -> `Congregations.Congregation_ID`
  - `New_Congregation` -> `Congregations.Congregation_ID`

### Congregations

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Congregation_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Congregations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CongregationsSchema.ts`
- **Foreign Keys:**
  - `Accounting_Company_ID` -> `Accounting_Companies.Accounting_Company_ID`
  - `Location_ID` -> `Locations.Location_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Pastor` -> `dp_Users.User_ID`
  - `Plan_A_Visit_Template` -> `dp_Communication_Templates.Communication_Template_ID`
  - `Plan_A_Visit_User` -> `dp_Users.User_ID`
  - `Sacrament_Place_ID` -> `Sacrament_Places.Sacrament_Place_ID`
  - `App_ID` -> `Pocket_Platform_Apps.App_ID`

### Contact_Attributes

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Contact_Attribute_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactAttributes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactAttributesSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Attribute_ID` -> `Attributes.Attribute_ID`

### Contact_Households

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Contact_Household_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactHouseholds.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactHouseholdsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Household_ID` -> `Households.Household_ID`
  - `Household_Position_ID` -> `Household_Positions.Household_Position_ID`
  - `Household_Type_ID` -> `Household_Types.Household_Type_ID`

### Contact_Identifier_Log

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Contact_Identifier_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactIdentifierLog.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactIdentifierLogSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`

### Contact_Log

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Contact_Log_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactLog.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactLogSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Contact_Log_Type_ID` -> `Contact_Log_Types.Contact_Log_Type_ID`
  - `Made_By` -> `dp_Users.User_ID`
  - `Planned_Contact_ID` -> `Planned_Contacts.Planned_Contact_ID`
  - `Original_Contact_Log_Entry` -> `Contact_Log.Contact_Log_ID`
  - `Feedback_Entry_ID` -> `Feedback_Entries.Feedback_Entry_ID`

### Contact_Log_Types

Access: Read | Permissions: None

- **Primary Key:** `Contact_Log_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactLogTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactLogTypesSchema.ts`

### Contact_Private_Notes

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Contact_Private_Note_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactPrivateNotes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactPrivateNotesSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### Contact_Relationships

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Contact_Relationship_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactRelationships.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactRelationshipsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Relationship_ID` -> `Relationships.Relationship_ID`
  - `Related_Contact_ID` -> `Contacts.Contact_ID`

### Contact_Staging

Access: ReadWriteAssignDelete | Permissions: DataExport

- **Primary Key:** `Contact_Staging_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactStaging.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactStagingSchema.ts`
- **Foreign Keys:**
  - `Existing_Contact_Record` -> `Contacts.Contact_ID`
  - `Prefix_ID` -> `Prefixes.Prefix_ID`
  - `Suffix_ID` -> `Suffixes.Suffix_ID`
  - `Gender_ID` -> `Genders.Gender_ID`
  - `Marital_Status_ID` -> `Marital_Statuses.Marital_Status_ID`
  - `Contact_Status_ID` -> `Contact_Statuses.Contact_Status_ID`
  - `Existing_Household_Record` -> `Households.Household_ID`
  - `Household_Position_ID` -> `Household_Positions.Household_Position_ID`
  - `Participant_Type_ID` -> `Participant_Types.Participant_Type_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Contact_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Contact_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactStatusesSchema.ts`

### Contacts

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Contact_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Contacts.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactsSchema.ts`
- **Foreign Keys:**
  - `Prefix_ID` -> `Prefixes.Prefix_ID`
  - `Suffix_ID` -> `Suffixes.Suffix_ID`
  - `Gender_ID` -> `Genders.Gender_ID`
  - `Marital_Status_ID` -> `Marital_Statuses.Marital_Status_ID`
  - `Contact_Status_ID` -> `Contact_Statuses.Contact_Status_ID`
  - `Household_ID` -> `Households.Household_ID`
  - `Household_Position_ID` -> `Household_Positions.Household_Position_ID`
  - `Participant_Record` -> `Participants.Participant_ID`
  - `Donor_Record` -> `Donors.Donor_ID`
  - `Industry_ID` -> `Industries.Industry_ID`
  - `Occupation_ID` -> `Occupations.Occupation_ID`
  - `User_Account` -> `dp_Users.User_ID`
  - `Primary_Language_ID` -> `Primary_Languages.Primary_Language_ID`
  - `Faith_Background_ID` -> `Faith_Backgrounds.Faith_Background_ID`
  - `Texting_Opt_In_Type_ID` -> `Texting_Opt_In_Types.Texting_Opt_In_Type_ID`

### Continents

Access: Read | Permissions: None

- **Primary Key:** `Continent_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Continents.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContinentsSchema.ts`

### Contribution_Statement_Donors

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Statement_Donor_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContributionStatementDonors.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContributionStatementDonorsSchema.ts`
- **Foreign Keys:**
  - `Statement_ID` -> `Contribution_Statements.Statement_ID`
  - `Donor_ID` -> `Donors.Donor_ID`

### Contribution_Statements

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Statement_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContributionStatements.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContributionStatementsSchema.ts`
- **Foreign Keys:**
  - `Accounting_Company_ID` -> `Accounting_Companies.Accounting_Company_ID`
  - `Household_ID` -> `Households.Household_ID`
  - `Statement_Type_ID` -> `Statement_Types.Statement_Type_ID`
  - `Contact_Record` -> `Contacts.Contact_ID`
  - `Spouse_Record` -> `Contacts.Contact_ID`
  - `Archived_Campaign` -> `Pledge_Campaigns.Pledge_Campaign_ID`
  - `Alternate_Archived_Campaign` -> `Pledge_Campaigns.Pledge_Campaign_ID`

### Countries

Access: Read | Permissions: None

- **Primary Key:** `Country_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Countries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CountriesSchema.ts`
- **Foreign Keys:**
  - `Continent_ID` -> `Continents.Continent_ID`

### Currencies

Access: Read | Permissions: None

- **Primary Key:** `Currency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Currencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CurrenciesSchema.ts`

### Custom_Widget_DS

Access: ReadWriteAssignDelete | Permissions: DataExport

- **Primary Key:** `Custom_Widget_DS_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CustomWidgetDs.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CustomWidgetDsSchema.ts`

### Date_Accuracies

Access: Read | Permissions: None

- **Primary Key:** `Date_Accuracy_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DateAccuracies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DateAccuraciesSchema.ts`

### Deposits

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Deposit_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Deposits.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DepositsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Donation_Distributions

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Donation_Distribution_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DonationDistributions.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DonationDistributionsSchema.ts`
- **Foreign Keys:**
  - `Donation_ID` -> `Donations.Donation_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Pledge_ID` -> `Pledges.Pledge_ID`
  - `Target_Event` -> `Events.Event_ID`
  - `Soft_Credit_Donor` -> `Donors.Donor_ID`
  - `Donation_Source_ID` -> `Donation_Sources.Donation_Source_ID`
  - `Projected_Gift_Frequency` -> `Frequencies.Frequency_ID`
  - `Soft_Credit_Statement_ID` -> `Contribution_Statements.Statement_ID`

### Donation_Frequencies

Access: Read | Permissions: None

- **Primary Key:** `Donation_Frequency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DonationFrequencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DonationFrequenciesSchema.ts`

### Donation_Levels

Access: Read | Permissions: None

- **Primary Key:** `Donation_Level_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DonationLevels.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DonationLevelsSchema.ts`

### Donation_Sources

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Donation_Source_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DonationSources.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DonationSourcesSchema.ts`
- **Foreign Keys:**
  - `Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`

### Donations

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Donation_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Donations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DonationsSchema.ts`
- **Foreign Keys:**
  - `Donor_ID` -> `Donors.Donor_ID`
  - `Payment_Type_ID` -> `Payment_Types.Payment_Type_ID`
  - `Batch_ID` -> `Batches.Batch_ID`
  - `Donor_Account_ID` -> `Donor_Accounts.Donor_Account_ID`
  - `Statement_ID` -> `Contribution_Statements.Statement_ID`

### Donor_Accounts

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Donor_Account_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DonorAccounts.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DonorAccountsSchema.ts`
- **Foreign Keys:**
  - `Donor_ID` -> `Donors.Donor_ID`
  - `Account_Type_ID` -> `Account_Types.Account_Type_ID`
  - `Bank_ID` -> `Banks.Bank_ID`

### Donors

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Donor_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Donors.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DonorsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Statement_Frequency_ID` -> `Statement_Frequencies.Statement_Frequency_ID`
  - `Statement_Type_ID` -> `Statement_Types.Statement_Type_ID`
  - `Statement_Method_ID` -> `Statement_Methods.Statement_Method_ID`
  - `Always_Soft_Credit` -> `Donors.Donor_ID`
  - `Always_Pledge_Credit` -> `Donors.Donor_ID`
  - `Donation_Frequency_ID` -> `Donation_Frequencies.Donation_Frequency_ID`
  - `Donation_Level_ID` -> `Donation_Levels.Donation_Level_ID`

### dp_Account_Information

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Account_Information_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpAccountInformation.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpAccountInformationSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Integration_Definition_Type_ID` -> `dp_Integration_Definition_Types.Integration_Definition_Type_ID`

### dp_API_Clients

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `API_Client_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpApiClients.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpApiClientsSchema.ts`
- **Foreign Keys:**
  - `Client_User_ID` -> `dp_Users.User_ID`
  - `Authentication_Flow_ID` -> `dp_Authentication_Flows.Authentication_Flow_ID`

### dp_Application_Labels

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Application_Label_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpApplicationLabels.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpApplicationLabelsSchema.ts`
- **Foreign Keys:**
  - `API_Client_ID` -> `dp_API_Clients.API_Client_ID`

### dp_Audit_Retention_Messages

Access: ReadWriteAssignDelete | Permissions: DataExport

- **Primary Key:** `Audit_Retention_Message_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpAuditRetentionMessages.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpAuditRetentionMessagesSchema.ts`
- **Foreign Keys:**
  - `_Audit_Retention_Policy_ID` -> `dp_Audit_Retention_Policies.Audit_Retention_Policy_ID`

### dp_Audit_Retention_Policies

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Audit_Retention_Policy_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpAuditRetentionPolicies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpAuditRetentionPoliciesSchema.ts`
- **Foreign Keys:**
  - `Retention_Type_ID` -> `dp_Audit_Retention_Types.Audit_Retention_Type_ID`
  - `Audit_Type_ID` -> `dp_Audit_Types.Audit_Type_ID`

### dp_Authentication_Log

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Authentication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpAuthenticationLog.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpAuthenticationLogSchema.ts`

### dp_Bookmarks

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Bookmark_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpBookmarks.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpBookmarksSchema.ts`

### dp_Communication_Messages

Access: ReadWriteAssign | Permissions: DataExport

- **Primary Key:** `Communication_Message_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpCommunicationMessages.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpCommunicationMessagesSchema.ts`
- **Foreign Keys:**
  - `Communication_ID` -> `dp_Communications.Communication_ID`
  - `Action_Status_ID` -> `dp_Communication_Action_Statuses.Action_Status_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### dp_Communication_Publications

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Communication_Publication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpCommunicationPublications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpCommunicationPublicationsSchema.ts`
- **Foreign Keys:**
  - `Communication_ID` -> `dp_Communications.Communication_ID`
  - `Publication_ID` -> `dp_Publications.Publication_ID`

### dp_Communication_Snippets

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Communication_Snippet_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpCommunicationSnippets.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpCommunicationSnippetsSchema.ts`
- **Foreign Keys:**
  - `Pertains_To` -> `dp_Pages.Page_ID`

### dp_Communication_Templates

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Communication_Template_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpCommunicationTemplates.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpCommunicationTemplatesSchema.ts`
- **Foreign Keys:**
  - `Pertains_To_Page_ID` -> `dp_Pages.Page_ID`
  - `Template_User` -> `dp_Users.User_ID`
  - `Template_User_Group` -> `dp_User_Groups.User_Group_ID`
  - `From_Contact` -> `Contacts.Contact_ID`
  - `Reply_to_Contact` -> `Contacts.Contact_ID`
  - `Communication_Type_ID` -> `dp_Communication_Types.Communication_Type_ID`

### dp_Communication_Types

Access: Read | Permissions: None

- **Primary Key:** `Communication_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpCommunicationTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpCommunicationTypesSchema.ts`

### dp_Communications

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Communication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpCommunications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpCommunicationsSchema.ts`
- **Foreign Keys:**
  - `Author_User_ID` -> `dp_Users.User_ID`
  - `Communication_Type_ID` -> `dp_Communication_Types.Communication_Type_ID`
  - `Communication_Status_ID` -> `dp_Communication_Statuses.Communication_Status_ID`
  - `Selection_ID` -> `dp_Selections.Selection_ID`
  - `Pertains_To_Page_ID` -> `dp_Pages.Page_ID`
  - `To_Contact` -> `Contacts.Contact_ID`
  - `From_SMS_Number` -> `dp_SMS_Numbers.SMS_Number_ID`
  - `From_Contact` -> `Contacts.Contact_ID`
  - `Reply_to_Contact` -> `Contacts.Contact_ID`
  - `Template_User` -> `dp_Users.User_ID`
  - `Template_User_Group` -> `dp_User_Groups.User_Group_ID`
  - `Alternate_Email_Type_ID` -> `Alternate_Email_Types.Alternate_Email_Type_ID`
  - `Publication_ID` -> `dp_Publications.Publication_ID`

### dp_Configuration_Lists

Access: ReadWrite | Permissions: DataExport

- **Primary Key:** `Configuration_List_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpConfigurationLists.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpConfigurationListsSchema.ts`

### dp_Configuration_Settings

Access: ReadWrite | Permissions: DataExport

- **Primary Key:** `Configuration_Setting_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpConfigurationSettings.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpConfigurationSettingsSchema.ts`
- **Foreign Keys:**
  - `Primary_Key_Page_ID` -> `dp_Pages.Page_ID`

### dp_Contact_Publications

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Contact_Publication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpContactPublications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpContactPublicationsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Publication_ID` -> `dp_Publications.Publication_ID`

### dp_Export_Log

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Export_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpExportLog.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpExportLogSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`

### dp_Field_Format_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Field_Format_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpFieldFormatTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpFieldFormatTypesSchema.ts`

### dp_Identity_Providers

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Identity_Provider_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpIdentityProviders.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpIdentityProvidersSchema.ts`
- **Foreign Keys:**
  - `Identity_Provider_Type_ID` -> `dp_Identity_Provider_Types.Identity_Provider_Type_ID`

### dp_Impersonate_Contacts

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Impersonate_Contact_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpImpersonateContacts.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpImpersonateContactsSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### dp_Inbound_SMS

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Inbound_SMS_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpInboundSms.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpInboundSmsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Last_Message_ID` -> `dp_Communication_Messages.Communication_Message_ID`

### dp_Integration_Definition_Types

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Integration_Definition_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpIntegrationDefinitionTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpIntegrationDefinitionTypesSchema.ts`

### dp_Notification_Page_Records

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Notification_Record_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpNotificationPageRecords.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpNotificationPageRecordsSchema.ts`
- **Foreign Keys:**
  - `Notification_ID` -> `dp_Notifications.Notification_ID`
  - `Page_ID` -> `dp_Pages.Page_ID`

### dp_Notification_Page_Views

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Notification_Page_View_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpNotificationPageViews.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpNotificationPageViewsSchema.ts`
- **Foreign Keys:**
  - `Notification_ID` -> `dp_Notifications.Notification_ID`
  - `Page_View_ID` -> `dp_Page_Views.Page_View_ID`

### dp_Notification_Selections

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Notification_Selection_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpNotificationSelections.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpNotificationSelectionsSchema.ts`
- **Foreign Keys:**
  - `Notification_ID` -> `dp_Notifications.Notification_ID`
  - `Selection_ID` -> `dp_Selections.Selection_ID`

### dp_Notification_Sub_Page_Views

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Notification_Sub_Page_View_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpNotificationSubPageViews.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpNotificationSubPageViewsSchema.ts`
- **Foreign Keys:**
  - `Notification_ID` -> `dp_Notifications.Notification_ID`
  - `Sub_Page_View_ID` -> `dp_Sub_Page_Views.Sub_Page_View_ID`

### dp_Notifications

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Notification_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpNotifications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpNotificationsSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `Template_ID` -> `dp_Communication_Templates.Communication_Template_ID`
  - `User_Group_ID` -> `dp_User_Groups.User_Group_ID`

### dp_Page_Views

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Page_View_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpPageViews.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpPageViewsSchema.ts`
- **Foreign Keys:**
  - `Page_ID` -> `dp_Pages.Page_ID`
  - `User_ID` -> `dp_Users.User_ID`
  - `User_Group_ID` -> `dp_User_Groups.User_Group_ID`

### dp_Process_Steps

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Process_Step_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpProcessSteps.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpProcessStepsSchema.ts`
- **Foreign Keys:**
  - `Process_Step_Type_ID` -> `dp_Process_Step_Types.Process_Step_Type_ID`
  - `Process_ID` -> `dp_Processes.Process_ID`
  - `Specific_User` -> `dp_Users.User_ID`
  - `Escalate_to_Step` -> `dp_Process_Steps.Process_Step_ID`
  - `Email_Template` -> `dp_Communication_Templates.Communication_Template_ID`
  - `To_Specific_Contact` -> `Contacts.Contact_ID`
  - `Webhook_ID` -> `dp_Webhooks.Webhook_ID`
  - `Text_Template` -> `dp_Communication_Templates.Communication_Template_ID`
  - `Specific_User_Group_ID` -> `dp_User_Groups.User_Group_ID`
  - `Completion_Rule_ID` -> `dp_Completion_Rules.Completion_Rule_ID`

### dp_Process_Submissions

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Process_Submission_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpProcessSubmissions.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpProcessSubmissionsSchema.ts`
- **Foreign Keys:**
  - `Submitted_By` -> `dp_Users.User_ID`
  - `Process_ID` -> `dp_Processes.Process_ID`
  - `Process_Submission_Status_ID` -> `dp_Process_Submission_Statuses.Process_Submission_Status_ID`

### dp_Processes

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Process_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpProcesses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpProcessesSchema.ts`
- **Foreign Keys:**
  - `Process_Manager` -> `dp_Users.User_ID`

### dp_Publications

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Publication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpPublications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpPublicationsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Moderator` -> `dp_Users.User_ID`

### dp_Record_Insights

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Record_Insight_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpRecordInsights.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpRecordInsightsSchema.ts`
- **Foreign Keys:**
  - `Page_ID` -> `dp_Pages.Page_ID`
  - `Sub_Page_View_ID` -> `dp_Sub_Page_Views.Sub_Page_View_ID`

### dp_Record_Security

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Record_Security_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpRecordSecurity.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpRecordSecuritySchema.ts`

### dp_Role_Reports

Access: ReadWriteAssignDelete | Permissions: DataExport

- **Primary Key:** `Role_Report_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpRoleReports.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpRoleReportsSchema.ts`
- **Foreign Keys:**
  - `Role_ID` -> `dp_Roles.Role_ID`
  - `Report_ID` -> `dp_Reports.Report_ID`

### dp_Roles

Access: ReadWriteAssign | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Role_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpRoles.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpRolesSchema.ts`
- **Foreign Keys:**
  - `Role_Type_ID` -> `dp_Role_Types.Role_Type_ID`

### dp_Secure_Configuration_Settings

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Secure_Configuration_Setting_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpSecureConfigurationSettings.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpSecureConfigurationSettingsSchema.ts`

### dp_SMS_Numbers

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `SMS_Number_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpSmsNumbers.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpSmsNumbersSchema.ts`
- **Foreign Keys:**
  - `User_Group_ID` -> `dp_User_Groups.User_Group_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Texting_Compliance_Level` -> `Texting_Compliance_Levels.Texting_Compliance_Level_ID`

### dp_Sub_Page_Views

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Sub_Page_View_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpSubPageViews.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpSubPageViewsSchema.ts`
- **Foreign Keys:**
  - `Sub_Page_ID` -> `dp_Sub_Pages.Sub_Page_ID`
  - `User_ID` -> `dp_Users.User_ID`

### dp_Tasks

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Task_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpTasks.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpTasksSchema.ts`
- **Foreign Keys:**
  - `Author_User_ID` -> `dp_Users.User_ID`
  - `Assigned_User_ID` -> `dp_Users.User_ID`
  - `_Process_Submission_ID` -> `dp_Process_Submissions.Process_Submission_ID`
  - `Assigned_User_Group_ID` -> `dp_User_Groups.User_Group_ID`
  - `Completion_Rule_ID` -> `dp_Completion_Rules.Completion_Rule_ID`

### dp_User_Charts

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `User_Chart_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUserCharts.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUserChartsSchema.ts`
- **Foreign Keys:**
  - `Chart_ID` -> `dp_Charts.Chart_ID`
  - `User_ID` -> `dp_Users.User_ID`
  - `Chart_Type_ID` -> `dp_Chart_Types.Chart_Type_ID`

### dp_User_Global_Filters

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `dp_User_Global_Filter_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUserGlobalFilters.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUserGlobalFiltersSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`

### dp_User_Groups

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `User_Group_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUserGroups.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUserGroupsSchema.ts`
- **Foreign Keys:**
  - `Moderator` -> `dp_Users.User_ID`

### dp_User_Preferences

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `User_Preference_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUserPreferences.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUserPreferencesSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `Page_ID` -> `dp_Pages.Page_ID`
  - `Sub_Page_ID` -> `dp_Sub_Pages.Sub_Page_ID`

### dp_User_Roles

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `User_Role_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUserRoles.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUserRolesSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `Role_ID` -> `dp_Roles.Role_ID`

### dp_User_User_Groups

Access: ReadWriteAssignDelete | Permissions: DataExport

- **Primary Key:** `User_User_Group_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUserUserGroups.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUserUserGroupsSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `User_Group_ID` -> `dp_User_Groups.User_Group_ID`

### dp_Users

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `User_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUsers.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUsersSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Supervisor` -> `dp_Users.User_ID`

### dp_View_Keys

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `View_Key_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpViewKeys.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpViewKeysSchema.ts`

### dp_Webhook_Invocations

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Webhook_Invocation_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpWebhookInvocations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpWebhookInvocationsSchema.ts`
- **Foreign Keys:**
  - `Webhook_ID` -> `dp_Webhooks.Webhook_ID`
  - `Status_ID` -> `dp_Webhook_Invocation_Statuses.Webhook_Invocation_Status_ID`
  - `Task_ID` -> `dp_Tasks.Task_ID`

### dp_Webhooks

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Webhook_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpWebhooks.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpWebhooksSchema.ts`

### Equipment

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Equipment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Equipment.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EquipmentSchema.ts`
- **Foreign Keys:**
  - `Equipment_Type_ID` -> `Equipment_Types.Equipment_Type_ID`
  - `Room_ID` -> `Rooms.Room_ID`
  - `Equipment_Coordinator` -> `dp_Users.User_ID`

### Equipment_Types

Access: Read | Permissions: None

- **Primary Key:** `Equipment_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EquipmentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EquipmentTypesSchema.ts`

### Event_Equipment

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Event_Equipment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventEquipment.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventEquipmentSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Equipment_ID` -> `Equipment.Equipment_ID`
  - `Room_ID` -> `Rooms.Room_ID`

### Event_Groups

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Event_Group_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventGroups.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventGroupsSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Group_ID` -> `Groups.Group_ID`
  - `Room_ID` -> `Rooms.Room_ID`
  - `Curriculum_ID` -> `Pocket_Platform_Curriculum.Curriculum_ID`

### Event_Metrics

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Event_Metric_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventMetrics.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventMetricsSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Metric_ID` -> `Metrics.Metric_ID`
  - `Group_ID` -> `Groups.Group_ID`

### Event_Participants

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Event_Participant_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventParticipants.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventParticipantsSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Participation_Status_ID` -> `Participation_Statuses.Participation_Status_ID`
  - `Group_Participant_ID` -> `Group_Participants.Group_Participant_ID`
  - `Group_ID` -> `Groups.Group_ID`
  - `Room_ID` -> `Rooms.Room_ID`
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`
  - `Response_ID` -> `Responses.Response_ID`
  - `RSVP_Status_ID` -> `RSVP_Statuses.RSVP_Status_ID`

### Event_Rooms

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Event_Room_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventRooms.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventRoomsSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Room_ID` -> `Rooms.Room_ID`
  - `Group_ID` -> `Groups.Group_ID`
  - `Room_Layout_ID` -> `Room_Layouts.Room_Layout_ID`

### Event_Services

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Event_Service_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventServices.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventServicesSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Service_ID` -> `Servicing.Service_ID`

### Event_Types

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Event_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventTypesSchema.ts`

### Events

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Event_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Events.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventsSchema.ts`
- **Foreign Keys:**
  - `Event_Type_ID` -> `Event_Types.Event_Type_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Location_ID` -> `Locations.Location_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Primary_Contact` -> `Contacts.Contact_ID`
  - `Visibility_Level_ID` -> `Visibility_Levels.Visibility_Level_ID`
  - `Online_Registration_Product` -> `Products.Product_ID`
  - `Registration_Form` -> `Forms.Form_ID`
  - `Search_Results` -> `Checkin_Search_Results_Types.Checkin_Search_Results_Type_ID`
  - `Registrant_Message` -> `dp_Communication_Templates.Communication_Template_ID`
  - `Optional_Reminder_Message` -> `dp_Communication_Templates.Communication_Template_ID`
  - `Attendee_Message` -> `dp_Communication_Templates.Communication_Template_ID`
  - `Parent_Event_ID` -> `Events.Event_ID`
  - `Priority_ID` -> `Priorities.Priority_ID`

### Faith_Backgrounds

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Faith_Background_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FaithBackgrounds.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FaithBackgroundsSchema.ts`

### Feedback_Entries

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Feedback_Entry_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FeedbackEntries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FeedbackEntriesSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Feedback_Type_ID` -> `Feedback_Types.Feedback_Type_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Visibility_Level_ID` -> `Visibility_Levels.Visibility_Level_ID`
  - `Assigned_To` -> `Contacts.Contact_ID`
  - `Care_Outcome_ID` -> `Care_Outcomes.Care_Outcome_ID`
  - `Care_Case_ID` -> `Care_Cases.Care_Case_ID`

### Feedback_Types

Access: Read | Permissions: None

- **Primary Key:** `Feedback_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FeedbackTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FeedbackTypesSchema.ts`

### Follow_Up_Action_Types

Access: Read | Permissions: None

- **Primary Key:** `Action_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FollowUpActionTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FollowUpActionTypesSchema.ts`

### Form_Field_Types

Access: Read | Permissions: None

- **Primary Key:** `Form_Field_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FormFieldTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FormFieldTypesSchema.ts`

### Form_Fields

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Form_Field_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FormFields.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FormFieldsSchema.ts`
- **Foreign Keys:**
  - `Field_Type_ID` -> `Form_Field_Types.Form_Field_Type_ID`
  - `Form_ID` -> `Forms.Form_ID`
  - `Depends_On` -> `Form_Fields.Form_Field_ID`

### Form_Response_Answers

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Form_Response_Answer_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FormResponseAnswers.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FormResponseAnswersSchema.ts`
- **Foreign Keys:**
  - `Form_Field_ID` -> `Form_Fields.Form_Field_ID`
  - `Form_Response_ID` -> `Form_Responses.Form_Response_ID`
  - `Event_Participant_ID` -> `Event_Participants.Event_Participant_ID`
  - `Pledge_ID` -> `Pledges.Pledge_ID`
  - `Opportunity_Response` -> `Responses.Response_ID`

### Form_Responses

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Form_Response_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FormResponses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FormResponsesSchema.ts`
- **Foreign Keys:**
  - `Form_ID` -> `Forms.Form_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Event_ID` -> `Events.Event_ID`
  - `Pledge_Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`
  - `Opportunity_ID` -> `Opportunities.Opportunity_ID`
  - `Opportunity_Response` -> `Responses.Response_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Event_Participant_ID` -> `Event_Participants.Event_Participant_ID`

### Forms

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Form_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Forms.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FormsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Primary_Contact` -> `Contacts.Contact_ID`
  - `Response_Message` -> `dp_Communication_Templates.Communication_Template_ID`

### Frequencies

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Frequency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Frequencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FrequenciesSchema.ts`

### Genders

Access: Read | Permissions: None

- **Primary Key:** `Gender_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Genders.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GendersSchema.ts`

### Genres

Access: Read | Permissions: None

- **Primary Key:** `Genre_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Genres.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GenresSchema.ts`

### Group_Activities

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_Activity_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupActivities.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupActivitiesSchema.ts`

### Group_Attributes

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Group_Attribute_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupAttributes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupAttributesSchema.ts`
- **Foreign Keys:**
  - `Attribute_ID` -> `Attributes.Attribute_ID`
  - `Group_ID` -> `Groups.Group_ID`

### Group_Ended_Reasons

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_Ended_Reason_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupEndedReasons.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupEndedReasonsSchema.ts`

### Group_Focuses

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_Focus_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupFocuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupFocusesSchema.ts`

### Group_Inquiries

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_Inquiry_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupInquiries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupInquiriesSchema.ts`
- **Foreign Keys:**
  - `Group_ID` -> `Groups.Group_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### Group_Participants

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_Participant_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupParticipants.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupParticipantsSchema.ts`
- **Foreign Keys:**
  - `Group_ID` -> `Groups.Group_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`

### Group_Role_Directions

Access: Read | Permissions: None

- **Primary Key:** `Group_Role_Direction_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupRoleDirections.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupRoleDirectionsSchema.ts`

### Group_Role_Intensities

Access: Read | Permissions: None

- **Primary Key:** `Group_Role_Intensity_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupRoleIntensities.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupRoleIntensitiesSchema.ts`

### Group_Role_Types

Access: Read | Permissions: None

- **Primary Key:** `Group_Role_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupRoleTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupRoleTypesSchema.ts`

### Group_Roles

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_Role_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupRoles.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupRolesSchema.ts`
- **Foreign Keys:**
  - `Group_Role_Type_ID` -> `Group_Role_Types.Group_Role_Type_ID`
  - `Group_Role_Direction_ID` -> `Group_Role_Directions.Group_Role_Direction_ID`
  - `Group_Role_Intensity_ID` -> `Group_Role_Intensities.Group_Role_Intensity_ID`
  - `Ministry_ID` -> `Ministries.Ministry_ID`

### Group_Rooms

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Group_Room_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupRooms.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupRoomsSchema.ts`
- **Foreign Keys:**
  - `Group_ID` -> `Groups.Group_ID`
  - `Room_ID` -> `Rooms.Room_ID`

### Group_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupTypesSchema.ts`
- **Foreign Keys:**
  - `Default_Role` -> `Group_Roles.Group_Role_ID`

### Groups

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Group_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Groups.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupsSchema.ts`
- **Foreign Keys:**
  - `Group_Type_ID` -> `Group_Types.Group_Type_ID`
  - `Ministry_ID` -> `Ministries.Ministry_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Primary_Contact` -> `Contacts.Contact_ID`
  - `Parent_Group` -> `Groups.Group_ID`
  - `Priority_ID` -> `Priorities.Priority_ID`
  - `Offsite_Meeting_Address` -> `Addresses.Address_ID`
  - `Life_Stage_ID` -> `Life_Stages.Life_Stage_ID`
  - `Group_Focus_ID` -> `Group_Focuses.Group_Focus_ID`
  - `Meeting_Day_ID` -> `Meeting_Days.Meeting_Day_ID`
  - `Meeting_Frequency_ID` -> `Meeting_Frequencies.Meeting_Frequency_ID`
  - `Meeting_Duration_ID` -> `Meeting_Durations.Meeting_Duration_ID`
  - `Required_Book` -> `Books.Book_ID`
  - `Descended_From` -> `Groups.Group_ID`
  - `Reason_Ended` -> `Group_Ended_Reasons.Group_Ended_Reason_ID`
  - `Promote_to_Group` -> `Groups.Group_ID`
  - `SMS_Number` -> `dp_SMS_Numbers.SMS_Number_ID`
  - `Default_Meeting_Room` -> `Rooms.Room_ID`

### Household_Care_Log

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Household_Care_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdCareLog.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdCareLogSchema.ts`
- **Foreign Keys:**
  - `Household_ID` -> `Households.Household_ID`
  - `Care_Type_ID` -> `Care_Types.Care_Type_ID`
  - `Care_Outcome_ID` -> `Care_Outcomes.Care_Outcome_ID`
  - `Provided_By` -> `Contacts.Contact_ID`
  - `Paid_To` -> `Contacts.Contact_ID`
  - `Care_Case_ID` -> `Care_Cases.Care_Case_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### Household_Identifier_Log

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Household_Identifier_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdIdentifierLog.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdIdentifierLogSchema.ts`
- **Foreign Keys:**
  - `Household_ID` -> `Households.Household_ID`

### Household_Positions

Access: Read | Permissions: None

- **Primary Key:** `Household_Position_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdPositions.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdPositionsSchema.ts`

### Household_Sources

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Household_Source_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdSources.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdSourcesSchema.ts`

### Household_Types

Access: Read | Permissions: None

- **Primary Key:** `Household_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdTypesSchema.ts`

### Households

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Household_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Households.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdsSchema.ts`
- **Foreign Keys:**
  - `Address_ID` -> `Addresses.Address_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Care_Person` -> `Contacts.Contact_ID`
  - `Household_Source_ID` -> `Household_Sources.Household_Source_ID`
  - `Alternate_Mailing_Address` -> `Addresses.Address_ID`

### Import_Destinations

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Import_Destination_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ImportDestinations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ImportDestinationsSchema.ts`

### Import_Templates

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Import_Template_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ImportTemplates.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ImportTemplatesSchema.ts`
- **Foreign Keys:**
  - `Import_Destination_ID` -> `Import_Destinations.Import_Destination_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Industries

Access: Read | Permissions: None

- **Primary Key:** `Industry_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Industries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/IndustriesSchema.ts`

### Invoice_Detail

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Invoice_Detail_ID`
- **Type:** `src/lib/providers/ministry-platform/models/InvoiceDetail.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/InvoiceDetailSchema.ts`
- **Foreign Keys:**
  - `Invoice_ID` -> `Invoices.Invoice_ID`
  - `Recipient_Contact_ID` -> `Contacts.Contact_ID`
  - `Event_Participant_ID` -> `Event_Participants.Event_Participant_ID`
  - `Product_ID` -> `Products.Product_ID`
  - `Product_Option_Price_ID` -> `Product_Option_Prices.Product_Option_Price_ID`

### Invoice_Sources

Access: Read | Permissions: None

- **Primary Key:** `Invoice_Source_ID`
- **Type:** `src/lib/providers/ministry-platform/models/InvoiceSources.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/InvoiceSourcesSchema.ts`

### Invoice_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Invoice_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/InvoiceStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/InvoiceStatusesSchema.ts`

### Invoices

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Invoice_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Invoices.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/InvoicesSchema.ts`
- **Foreign Keys:**
  - `Purchaser_Contact_ID` -> `Contacts.Contact_ID`
  - `Invoice_Status_ID` -> `Invoice_Statuses.Invoice_Status_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Invoice_Source` -> `Invoice_Sources.Invoice_Source_ID`

### Item_Priorities

Access: Read | Permissions: None

- **Primary Key:** `Item_Priority_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ItemPriorities.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ItemPrioritiesSchema.ts`

### Item_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Item_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ItemStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ItemStatusesSchema.ts`

### Journeys

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Journey_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Journeys.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/JourneysSchema.ts`
- **Foreign Keys:**
  - `Leadership_Team` -> `Groups.Group_ID`

### Letters

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Letter_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Letters.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LettersSchema.ts`
- **Foreign Keys:**
  - `Page_ID` -> `dp_Pages.Page_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Life_Stages

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Life_Stage_ID`
- **Type:** `src/lib/providers/ministry-platform/models/LifeStages.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LifeStagesSchema.ts`

### Location_Categories

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Location_Category_ID`
- **Type:** `src/lib/providers/ministry-platform/models/LocationCategories.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LocationCategoriesSchema.ts`

### Location_Group_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Location_Group_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/LocationGroupTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LocationGroupTypesSchema.ts`

### Location_Groups

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Location_Group_ID`
- **Type:** `src/lib/providers/ministry-platform/models/LocationGroups.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LocationGroupsSchema.ts`
- **Foreign Keys:**
  - `Location_Group_Type_ID` -> `Location_Group_Types.Location_Group_Type_ID`
  - `Parent_Location_Group` -> `Location_Groups.Location_Group_ID`

### Location_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Location_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/LocationTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LocationTypesSchema.ts`

### Locations

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Location_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Locations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LocationsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Location_Type_ID` -> `Location_Types.Location_Type_ID`
  - `Address_ID` -> `Addresses.Address_ID`
  - `Location_Group_ID` -> `Location_Groups.Location_Group_ID`
  - `Mailing_Address_ID` -> `Addresses.Address_ID`
  - `Location_Category_ID` -> `Location_Categories.Location_Category_ID`

### Maintenance_Requests

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Maintenance_Request_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MaintenanceRequests.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MaintenanceRequestsSchema.ts`
- **Foreign Keys:**
  - `Submitted_For` -> `dp_Users.User_ID`

### Mapping_Values

Access: Read | Permissions: None

- **Primary Key:** `Mapping_Value_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MappingValues.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MappingValuesSchema.ts`

### Marital_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Marital_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MaritalStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MaritalStatusesSchema.ts`

### Meeting_Days

Access: Read | Permissions: None

- **Primary Key:** `Meeting_Day_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MeetingDays.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MeetingDaysSchema.ts`

### Meeting_Durations

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Meeting_Duration_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MeetingDurations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MeetingDurationsSchema.ts`

### Meeting_Frequencies

Access: Read | Permissions: None

- **Primary Key:** `Meeting_Frequency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MeetingFrequencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MeetingFrequenciesSchema.ts`

### Member_Statuses

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Member_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MemberStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MemberStatusesSchema.ts`

### Memorized_Batches

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Memorized_Batch_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MemorizedBatches.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MemorizedBatchesSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Metrics

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Metric_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Metrics.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MetricsSchema.ts`

### Milestones

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Milestone_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Milestones.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MilestonesSchema.ts`
- **Foreign Keys:**
  - `Journey_ID` -> `Journeys.Journey_ID`
  - `Next_Milestone` -> `Milestones.Milestone_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Ministries

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Ministry_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Ministries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MinistriesSchema.ts`
- **Foreign Keys:**
  - `Primary_Contact` -> `Contacts.Contact_ID`
  - `Parent_Ministry` -> `Ministries.Ministry_ID`
  - `Priority_ID` -> `Priorities.Priority_ID`
  - `Leadership_Team` -> `Groups.Group_ID`

### MobileApp_Menu_Items

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `MobileApp_Menu_Item_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MobileappMenuItems.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MobileappMenuItemsSchema.ts`
- **Foreign Keys:**
  - `Role_ID` -> `dp_Roles.Role_ID`

### mp_vw_Current_Program_Participants

Access: Read | Permissions: None

- **Primary Key:** `mp_vw_Current_Program_Participants_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MpVwCurrentProgramParticipants.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MpVwCurrentProgramParticipantsSchema.ts`

### mp_vw_Last_Known_Activity

Access: Read | Permissions: None

- **Primary Key:** `mp_vw_Last_Known_Activity_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MpVwLastKnownActivity.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MpVwLastKnownActivitySchema.ts`

### mp_vw_possible_leaders

Access: Read | Permissions: None

- **Primary Key:** `mp_vw_possible_leaders_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MpVwPossibleLeaders.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MpVwPossibleLeadersSchema.ts`

### mp_vw_Primary_HH

Access: Read | Permissions: None

- **Primary Key:** `mp_vw_Primary_HH_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MpVwPrimaryHh.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MpVwPrimaryHhSchema.ts`

### Need_Campaigns

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Need_Campaign_ID`
- **Type:** `src/lib/providers/ministry-platform/models/NeedCampaigns.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/NeedCampaignsSchema.ts`

### Need_Providers

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Need_Provider_ID`
- **Type:** `src/lib/providers/ministry-platform/models/NeedProviders.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/NeedProvidersSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`

### Need_Type_Providers

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Need_Type_Provider_ID`
- **Type:** `src/lib/providers/ministry-platform/models/NeedTypeProviders.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/NeedTypeProvidersSchema.ts`
- **Foreign Keys:**
  - `Need_Type_ID` -> `Need_Types.Need_Type_ID`
  - `Need_Provider_ID` -> `Need_Providers.Need_Provider_ID`

### Need_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Need_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/NeedTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/NeedTypesSchema.ts`
- **Foreign Keys:**
  - `Need_Campaign_ID` -> `Need_Campaigns.Need_Campaign_ID`

### Needs

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Need_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Needs.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/NeedsSchema.ts`
- **Foreign Keys:**
  - `Requester_Contact` -> `Contacts.Contact_ID`
  - `Need_Campaign_ID` -> `Need_Campaigns.Need_Campaign_ID`
  - `Need_Type_ID` -> `Need_Types.Need_Type_ID`
  - `Need_Provider_ID` -> `Need_Providers.Need_Provider_ID`
  - `Care_Case_ID` -> `Care_Cases.Care_Case_ID`

### Occupations

Access: Read | Permissions: None

- **Primary Key:** `Occupation_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Occupations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/OccupationsSchema.ts`

### Opportunities

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Opportunity_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Opportunities.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/OpportunitiesSchema.ts`
- **Foreign Keys:**
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Visibility_Level_ID` -> `Visibility_Levels.Visibility_Level_ID`
  - `Contact_Person` -> `Contacts.Contact_ID`
  - `Add_to_Group` -> `Groups.Group_ID`
  - `Add_to_Event` -> `Events.Event_ID`
  - `Required_Gender` -> `Genders.Gender_ID`
  - `Custom_Form` -> `Forms.Form_ID`
  - `Response_Message` -> `dp_Communication_Templates.Communication_Template_ID`
  - `Optional_Reminder_Message` -> `dp_Communication_Templates.Communication_Template_ID`

### Opportunity_Attributes

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Opportunity_Attribute_ID`
- **Type:** `src/lib/providers/ministry-platform/models/OpportunityAttributes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/OpportunityAttributesSchema.ts`
- **Foreign Keys:**
  - `Attribute_ID` -> `Attributes.Attribute_ID`
  - `Opportunity_ID` -> `Opportunities.Opportunity_ID`

### Ordination_Types

Access: Read | Permissions: None

- **Primary Key:** `Ordination_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/OrdinationTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/OrdinationTypesSchema.ts`

### Participant_Certifications

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Participant_Certification_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipantCertifications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantCertificationsSchema.ts`
- **Foreign Keys:**
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Certification_Type_ID` -> `Certification_Types.Certification_Type_ID`

### Participant_Engagement

Access: Read | Permissions: None

- **Primary Key:** `Participant_Engagement_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipantEngagement.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantEngagementSchema.ts`

### Participant_Milestones

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Participant_Milestone_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipantMilestones.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantMilestonesSchema.ts`
- **Foreign Keys:**
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Milestone_ID` -> `Milestones.Milestone_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Event_ID` -> `Events.Event_ID`
  - `Witness` -> `Contacts.Contact_ID`

### Participant_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Participant_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipantTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantTypesSchema.ts`
- **Foreign Keys:**
  - `Set_Inactivated_To` -> `Participant_Types.Participant_Type_ID`
  - `Set_Reactivated_To` -> `Participant_Types.Participant_Type_ID`

### Participants

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Participant_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Participants.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Participant_Type_ID` -> `Participant_Types.Participant_Type_ID`
  - `Member_Status_ID` -> `Member_Statuses.Member_Status_ID`
  - `Participant_Engagement_ID` -> `Participant_Engagement.Participant_Engagement_ID`
  - `Church_of_Record` -> `Households.Household_ID`

### Participation_Items

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Participation_Item_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipationItems.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipationItemsSchema.ts`

### Participation_Requirements

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Participation_Requirement_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipationRequirements.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipationRequirementsSchema.ts`
- **Foreign Keys:**
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`
  - `Background_Check_Type_ID` -> `Background_Check_Types.Background_Check_Type_ID`
  - `Certification_Type_ID` -> `Certification_Types.Certification_Type_ID`
  - `Milestone_ID` -> `Milestones.Milestone_ID`
  - `Custom_Form_ID` -> `Forms.Form_ID`

### Participation_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Participation_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipationStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipationStatusesSchema.ts`

### Payment_Detail

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Payment_Detail_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PaymentDetail.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PaymentDetailSchema.ts`
- **Foreign Keys:**
  - `Payment_ID` -> `Payments.Payment_ID`
  - `Invoice_Detail_ID` -> `Invoice_Detail.Invoice_Detail_ID`

### Payment_Types

Access: Read | Permissions: None

- **Primary Key:** `Payment_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PaymentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PaymentTypesSchema.ts`

### Payments

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Payment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Payments.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PaymentsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Payment_Type_ID` -> `Payment_Types.Payment_Type_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Invoice_ID` -> `Invoices.Invoice_ID`

### Personnel

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Personnel.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Personnel_Type_ID` -> `Personnel_Types.Personnel_Type_ID`
  - `Personnel_Record_Status_ID` -> `Personnel_Record_Statuses.Personnel_Record_Status_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Citizenship_Type_ID` -> `Citizenship_Types.Citizenship_Type_ID`
  - `Personnel_Category_ID` -> `Personnel_Categories.Personnel_Category_ID`

### Personnel_Assignment_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Assignment_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelAssignmentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelAssignmentTypesSchema.ts`

### Personnel_Assignments

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Assignment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelAssignments.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelAssignmentsSchema.ts`
- **Foreign Keys:**
  - `Personnel_ID` -> `Personnel.Personnel_ID`
  - `Personnel_Assignment_Type_ID` -> `Personnel_Assignment_Types.Personnel_Assignment_Type_ID`
  - `Location_ID` -> `Locations.Location_ID`
  - `Assignment_Role_ID` -> `Assignment_Roles.Assignment_Role_ID`

### Personnel_Beneficiaries

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Beneficiary_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelBeneficiaries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelBeneficiariesSchema.ts`
- **Foreign Keys:**
  - `Personnel_ID` -> `Personnel.Personnel_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Beneficiary_Relationship_ID` -> `Beneficiary_Relationships.Beneficiary_Relationship_ID`

### Personnel_Benefits

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Benefit_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelBenefits.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelBenefitsSchema.ts`
- **Foreign Keys:**
  - `Personnel_ID` -> `Personnel.Personnel_ID`
  - `Benefit_Type_ID` -> `Benefit_Types.Benefit_Type_ID`

### Personnel_Categories

Access: Read | Permissions: None

- **Primary Key:** `Personnel_Category_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelCategories.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelCategoriesSchema.ts`

### Personnel_Comment_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Comment_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelCommentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelCommentTypesSchema.ts`

### Personnel_Comments

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Comment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelComments.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelCommentsSchema.ts`
- **Foreign Keys:**
  - `Personnel_ID` -> `Personnel.Personnel_ID`
  - `Personnel_Comment_Type_ID` -> `Personnel_Comment_Types.Personnel_Comment_Type_ID`

### Personnel_Estate_Plans

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Estate_Plan_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelEstatePlans.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelEstatePlansSchema.ts`
- **Foreign Keys:**
  - `Personnel_ID` -> `Personnel.Personnel_ID`

### Personnel_Ordination

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Ordination_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelOrdination.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelOrdinationSchema.ts`
- **Foreign Keys:**
  - `Personnel_ID` -> `Personnel.Personnel_ID`
  - `Deacon_Ordained_Here` -> `Church_Associations.Church_Association_ID`
  - `Religious_Order_ID` -> `Religious_Orders.Religious_Order_ID`
  - `Religious_Order_Status_ID` -> `Religious_Order_Statuses.Religious_Order_Status_ID`
  - `Priesthood_Ordained_Here` -> `Church_Associations.Church_Association_ID`

### Personnel_Record_Statuses

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Record_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelRecordStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelRecordStatusesSchema.ts`

### Personnel_Resume_Item_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Resume_Item_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelResumeItemTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelResumeItemTypesSchema.ts`

### Personnel_Resume_Items

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Resume_Item_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelResumeItems.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelResumeItemsSchema.ts`
- **Foreign Keys:**
  - `Personnel_ID` -> `Personnel.Personnel_ID`
  - `Resume_Item_Type_ID` -> `Personnel_Resume_Item_Types.Resume_Item_Type_ID`
  - `Location_ID` -> `Locations.Location_ID`

### Personnel_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Personnel_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelTypesSchema.ts`

### Perspectives

Access: Read | Permissions: None

- **Primary Key:** `Perspective_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Perspectives.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PerspectivesSchema.ts`

### Planned_Contacts

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Planned_Contact_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PlannedContacts.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PlannedContactsSchema.ts`
- **Foreign Keys:**
  - `Manager` -> `dp_Users.User_ID`
  - `Next_Planned_Contact` -> `Planned_Contacts.Planned_Contact_ID`
  - `Next_Contact_By` -> `dp_Users.User_ID`
  - `Call_Team` -> `Groups.Group_ID`

### Pledge_Adjustment_Types

Access: Read | Permissions: None

- **Primary Key:** `Pledge_Adjustment_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeAdjustmentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeAdjustmentTypesSchema.ts`

### Pledge_Adjustments

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Pledge_Adjustment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeAdjustments.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeAdjustmentsSchema.ts`
- **Foreign Keys:**
  - `Pledge_ID` -> `Pledges.Pledge_ID`
  - `Pledge_Adjustment_Type_ID` -> `Pledge_Adjustment_Types.Pledge_Adjustment_Type_ID`

### Pledge_Campaign_Types

Access: Read | Permissions: None

- **Primary Key:** `Pledge_Campaign_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeCampaignTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeCampaignTypesSchema.ts`

### Pledge_Campaigns

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Pledge_Campaign_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeCampaigns.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeCampaignsSchema.ts`
- **Foreign Keys:**
  - `Pledge_Campaign_Type_ID` -> `Pledge_Campaign_Types.Pledge_Campaign_Type_ID`
  - `Event_ID` -> `Events.Event_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Registration_Form` -> `Forms.Form_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Pledge_Frequencies

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Pledge_Frequency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeFrequencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeFrequenciesSchema.ts`

### Pledge_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Pledge_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeStatusesSchema.ts`

### Pledges

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Pledge_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Pledges.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgesSchema.ts`
- **Foreign Keys:**
  - `Donor_ID` -> `Donors.Donor_ID`
  - `Pledge_Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`
  - `Pledge_Status_ID` -> `Pledge_Statuses.Pledge_Status_ID`
  - `Parish_Credited_ID` -> `Congregations.Congregation_ID`
  - `_Gift_Frequency` -> `Frequencies.Frequency_ID`
  - `Donation_Source_ID` -> `Donation_Sources.Donation_Source_ID`
  - `Batch_ID` -> `Batches.Batch_ID`

### Pocket_Platform_Devices

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Device_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PocketPlatformDevices.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PocketPlatformDevicesSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `App_ID` -> `Pocket_Platform_Apps.App_ID`

### Pocket_Platform_Migrations

Access: Read | Permissions: None

- **Primary Key:** `Pocket_Platform_Migrations_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PocketPlatformMigrations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PocketPlatformMigrationsSchema.ts`

### Prefixes

Access: Read | Permissions: None

- **Primary Key:** `Prefix_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Prefixes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PrefixesSchema.ts`

### Primary_Languages

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Primary_Language_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PrimaryLanguages.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PrimaryLanguagesSchema.ts`

### Print_Servers

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Print_Server_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PrintServers.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PrintServersSchema.ts`

### Priorities

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Priority_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Priorities.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PrioritiesSchema.ts`
- **Foreign Keys:**
  - `Perspective_ID` -> `Perspectives.Perspective_ID`
  - `Parent_Priority_ID` -> `Priorities.Priority_ID`

### Procedures

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Procedure_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Procedures.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProceduresSchema.ts`
- **Foreign Keys:**
  - `User_ID` -> `dp_Users.User_ID`
  - `Ministry_ID` -> `Ministries.Ministry_ID`
  - `Page_ID` -> `dp_Pages.Page_ID`

### Product_Option_Groups

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Product_Option_Group_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ProductOptionGroups.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProductOptionGroupsSchema.ts`
- **Foreign Keys:**
  - `Product_ID` -> `Products.Product_ID`

### Product_Option_Prices

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Product_Option_Price_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ProductOptionPrices.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProductOptionPricesSchema.ts`
- **Foreign Keys:**
  - `Product_Option_Group_ID` -> `Product_Option_Groups.Product_Option_Group_ID`
  - `Add_to_Group` -> `Groups.Group_ID`

### Products

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Product_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Products.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProductsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Price_Currency` -> `Currencies.Currency_ID`

### Program_Groups

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Program_Group_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ProgramGroups.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProgramGroupsSchema.ts`
- **Foreign Keys:**
  - `Program_ID` -> `Programs.Program_ID`
  - `Group_ID` -> `Groups.Group_ID`
  - `Room_ID` -> `Rooms.Room_ID`

### Program_Types

Access: Read | Permissions: None

- **Primary Key:** `Program_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ProgramTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProgramTypesSchema.ts`

### Programs

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Program_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Programs.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProgramsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Ministry_ID` -> `Ministries.Ministry_ID`
  - `Program_Type_ID` -> `Program_Types.Program_Type_ID`
  - `Leadership_Team` -> `Groups.Group_ID`
  - `Primary_Contact` -> `Contacts.Contact_ID`
  - `Priority_ID` -> `Priorities.Priority_ID`
  - `Statement_Header_ID` -> `Statement_Headers.Statement_Header_ID`
  - `Pledge_Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`
  - `Default_Target_Event` -> `Events.Event_ID`
  - `SMS_Number` -> `dp_SMS_Numbers.SMS_Number_ID`

### Relationships

Access: Read | Permissions: None

- **Primary Key:** `Relationship_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Relationships.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RelationshipsSchema.ts`
- **Foreign Keys:**
  - `Reciprocal_Relationship_ID` -> `Relationships.Relationship_ID`

### Religious_Order_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Religious_Order_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ReligiousOrderStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ReligiousOrderStatusesSchema.ts`

### Religious_Orders

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Religious_Order_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ReligiousOrders.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ReligiousOrdersSchema.ts`

### Request_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Request_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/RequestStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RequestStatusesSchema.ts`

### Response_Follow_Ups

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Response_Follow_Up_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ResponseFollowUps.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ResponseFollowUpsSchema.ts`
- **Foreign Keys:**
  - `Response_ID` -> `Responses.Response_ID`
  - `Action_Type_ID` -> `Follow_Up_Action_Types.Action_Type_ID`
  - `Made_By` -> `dp_Users.User_ID`

### Response_Results

Access: Read | Permissions: None

- **Primary Key:** `Response_Result_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ResponseResults.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ResponseResultsSchema.ts`

### Responses

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Response_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Responses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ResponsesSchema.ts`
- **Foreign Keys:**
  - `Opportunity_ID` -> `Opportunities.Opportunity_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Response_Result_ID` -> `Response_Results.Response_Result_ID`
  - `Event_ID` -> `Events.Event_ID`

### Room_Layouts

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Room_Layout_ID`
- **Type:** `src/lib/providers/ministry-platform/models/RoomLayouts.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RoomLayoutsSchema.ts`
- **Foreign Keys:**
  - `Room_ID` -> `Rooms.Room_ID`

### Room_Usage_Types

Access: Read | Permissions: None

- **Primary Key:** `Room_Usage_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/RoomUsageTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RoomUsageTypesSchema.ts`

### Rooms

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Room_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Rooms.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RoomsSchema.ts`
- **Foreign Keys:**
  - `Building_ID` -> `Buildings.Building_ID`
  - `Default_Room_Layout` -> `Room_Layouts.Room_Layout_ID`
  - `Room_Usage_Type_ID` -> `Room_Usage_Types.Room_Usage_Type_ID`
  - `Parent_Room_ID` -> `Rooms.Room_ID`
  - `Print_Server_ID` -> `Print_Servers.Print_Server_ID`

### RSVP_Statuses

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `RSVP_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/RsvpStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RsvpStatusesSchema.ts`

### Sacrament_Places

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Sacrament_Place_ID`
- **Type:** `src/lib/providers/ministry-platform/models/SacramentPlaces.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SacramentPlacesSchema.ts`
- **Foreign Keys:**
  - `Address_ID` -> `Addresses.Address_ID`
  - `Mailing_Address_ID` -> `Addresses.Address_ID`
  - `Church_Association_ID` -> `Church_Associations.Church_Association_ID`

### Sacrament_Sponsors

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Sacrament_Sponsor_ID`
- **Type:** `src/lib/providers/ministry-platform/models/SacramentSponsors.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SacramentSponsorsSchema.ts`
- **Foreign Keys:**
  - `Sacrament_ID` -> `Sacraments.Sacrament_ID`
  - `Sponsor_ID` -> `Contacts.Contact_ID`
  - `Sponsor_Type_ID` -> `Sponsor_Types.Sponsor_Type_ID`

### Sacrament_Types

Access: Read | Permissions: None

- **Primary Key:** `Sacrament_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/SacramentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SacramentTypesSchema.ts`

### Sacraments

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Sacrament_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Sacraments.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SacramentsSchema.ts`
- **Foreign Keys:**
  - `Sacrament_Type_ID` -> `Sacrament_Types.Sacrament_Type_ID`
  - `Date_Received_Accuracy_ID` -> `Date_Accuracies.Date_Accuracy_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Performed_By_ID` -> `Contacts.Contact_ID`
  - `Place_ID` -> `Sacrament_Places.Sacrament_Place_ID`
  - `Father_ID` -> `Contacts.Contact_ID`
  - `Mother_ID` -> `Contacts.Contact_ID`
  - `Spouse_ID` -> `Participants.Participant_ID`
  - `Ordination_Type_ID` -> `Ordination_Types.Ordination_Type_ID`

### Schedule_Roles

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Schedule_Role_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ScheduleRoles.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ScheduleRolesSchema.ts`
- **Foreign Keys:**
  - `Schedule_ID` -> `Schedules.Schedule_ID`
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`

### Schedule_Statuses

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Schedule_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ScheduleStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ScheduleStatusesSchema.ts`

### Scheduled_Donation_Distributions

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Scheduled_Donation_Distribution_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ScheduledDonationDistributions.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ScheduledDonationDistributionsSchema.ts`
- **Foreign Keys:**
  - `Scheduled_Donation_ID` -> `Scheduled_Donations.Scheduled_Donation_ID`
  - `Program_ID` -> `Programs.Program_ID`
  - `Pledge_ID` -> `Pledges.Pledge_ID`
  - `Donation_Source_ID` -> `Donation_Sources.Donation_Source_ID`
  - `Parish_Credited_ID` -> `Congregations.Congregation_ID`
  - `Target_Event` -> `Events.Event_ID`

### Scheduled_Donations

Access: ReadWriteAssignDelete | Permissions: DataExport

- **Primary Key:** `Scheduled_Donation_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ScheduledDonations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ScheduledDonationsSchema.ts`
- **Foreign Keys:**
  - `Donor_ID` -> `Donors.Donor_ID`
  - `Donor_Account_ID` -> `Donor_Accounts.Donor_Account_ID`
  - `Target_Event` -> `Events.Event_ID`
  - `Payment_Type_ID` -> `Payment_Types.Payment_Type_ID`
  - `Gift_Frequency_ID` -> `Frequencies.Frequency_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Memorized_Batch_ID` -> `Memorized_Batches.Memorized_Batch_ID`

### Scheduled_Participants

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Schedule_Participant_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ScheduledParticipants.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ScheduledParticipantsSchema.ts`
- **Foreign Keys:**
  - `Schedule_Role_ID` -> `Schedule_Roles.Schedule_Role_ID`
  - `Participant_ID` -> `Participants.Participant_ID`

### Schedules

Access: ReadWriteAssignDelete | Permissions: FileAttach

- **Primary Key:** `Schedule_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Schedules.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SchedulesSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Schedule_Status_ID` -> `Schedule_Statuses.Schedule_Status_ID`
  - `Group_ID` -> `Groups.Group_ID`
  - `Primary_Contact` -> `Contacts.Contact_ID`

### Service_Types

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Service_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ServiceTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ServiceTypesSchema.ts`

### Servicing

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Service_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Servicing.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ServicingSchema.ts`
- **Foreign Keys:**
  - `Service_Type_ID` -> `Service_Types.Service_Type_ID`
  - `Team_Group_ID` -> `Groups.Group_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### Sponsor_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Sponsor_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/SponsorTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SponsorTypesSchema.ts`

### Staff

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Staff_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Staff.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/StaffSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`

### Statement_Cutoff_Automation

Access: Read | Permissions: None

- **Primary Key:** `Statement_Cutoff_Automation_ID`
- **Type:** `src/lib/providers/ministry-platform/models/StatementCutoffAutomation.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/StatementCutoffAutomationSchema.ts`

### Statement_Frequencies

Access: Read | Permissions: None

- **Primary Key:** `Statement_Frequency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/StatementFrequencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/StatementFrequenciesSchema.ts`

### Statement_Headers

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Statement_Header_ID`
- **Type:** `src/lib/providers/ministry-platform/models/StatementHeaders.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/StatementHeadersSchema.ts`

### Statement_Methods

Access: Read | Permissions: None

- **Primary Key:** `Statement_Method_ID`
- **Type:** `src/lib/providers/ministry-platform/models/StatementMethods.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/StatementMethodsSchema.ts`

### Statement_Types

Access: Read | Permissions: None

- **Primary Key:** `Statement_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/StatementTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/StatementTypesSchema.ts`

### Suffixes

Access: Read | Permissions: None

- **Primary Key:** `Suffix_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Suffixes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SuffixesSchema.ts`

### Suggestion_Types

Access: Read | Permissions: None

- **Primary Key:** `Suggestion_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/SuggestionTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SuggestionTypesSchema.ts`

### Texting_Compliance_Levels

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Texting_Compliance_Level_ID`
- **Type:** `src/lib/providers/ministry-platform/models/TextingComplianceLevels.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/TextingComplianceLevelsSchema.ts`

### Texting_Opt_In_Types

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport

- **Primary Key:** `Texting_Opt_In_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/TextingOptInTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/TextingOptInTypesSchema.ts`

### Time_Off_Types

Access: Read | Permissions: None

- **Primary Key:** `Time_Off_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/TimeOffTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/TimeOffTypesSchema.ts`

### Visibility_Levels

Access: Read | Permissions: None

- **Primary Key:** `Visibility_Level_ID`
- **Type:** `src/lib/providers/ministry-platform/models/VisibilityLevels.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VisibilityLevelsSchema.ts`

### Volunteer_Unavailable_Dates

Access: ReadWriteAssignDelete | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Volunteer_Unavailable_Date_ID`
- **Type:** `src/lib/providers/ministry-platform/models/VolunteerUnavailableDates.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VolunteerUnavailableDatesSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`

### vw_mp_Campaign_Goals

Access: Read | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Campaign_Goal_ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpCampaignGoals.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpCampaignGoalsSchema.ts`
- **Foreign Keys:**
  - `Campaign_Goal_ID` -> `Campaign_Goals.Campaign_Goal_ID`
  - `Pledge_Campaign_ID` -> `Pledge_Campaigns.Pledge_Campaign_ID`

### vw_mp_Contact_Details

Access: Read | Permissions: None

- **Primary Key:** `ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpContactDetails.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpContactDetailsSchema.ts`

### vw_mp_contact_mail_name

Access: Read | Permissions: DataExport

- **Primary Key:** `Contact_ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpContactMailName.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpContactMailNameSchema.ts`

### vw_mp_giving_unit_summary

Access: Read | Permissions: DataExport

- **Primary Key:** `Household_ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpGivingUnitSummary.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpGivingUnitSummarySchema.ts`
- **Foreign Keys:**
  - `Household_ID` -> `Households.Household_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### vw_mp_Participation_Compliance

Access: Read | Permissions: DataExport

- **Primary Key:** `ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpParticipationCompliance.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpParticipationComplianceSchema.ts`
- **Foreign Keys:**
  - `Group_ID` -> `Groups.Group_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`

### vw_mp_Participation_Compliance_Details

Access: Read | Permissions: DataExport

- **Primary Key:** `ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpParticipationComplianceDetails.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpParticipationComplianceDetailsSchema.ts`
- **Foreign Keys:**
  - `Group_ID` -> `Groups.Group_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`
  - `Background_Check_Type_ID` -> `Background_Check_Types.Background_Check_Type_ID`
  - `Certification_Type_ID` -> `Certification_Types.Certification_Type_ID`
  - `Milestone_ID` -> `Milestones.Milestone_ID`
  - `Custom_Form_ID` -> `Forms.Form_ID`

### vw_mp_Personnel_Audit_Overview

Access: Read | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `Audit_Item_ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpPersonnelAuditOverview.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpPersonnelAuditOverviewSchema.ts`

### vw_mp_Projected_Scheduled_Donations

Access: Read | Permissions: FileAttach, DataExport, SecureRecord

- **Primary Key:** `ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpProjectedScheduledDonations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpProjectedScheduledDonationsSchema.ts`
- **Foreign Keys:**
  - `Scheduled_Donation_ID` -> `Scheduled_Donations.Scheduled_Donation_ID`
  - `Donor_ID` -> `Donors.Donor_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Donor_Account_ID` -> `Donor_Accounts.Donor_Account_ID`
  - `Payment_Type_ID` -> `Payment_Types.Payment_Type_ID`
  - `Gift_Frequency_ID` -> `Frequencies.Frequency_ID`

### vw_mp_Response_Qualification_Details

Access: Read | Permissions: DataExport

- **Primary Key:** `ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpResponseQualificationDetails.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpResponseQualificationDetailsSchema.ts`
- **Foreign Keys:**
  - `Response_ID` -> `Responses.Response_ID`
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Background_Check_Type_ID` -> `Background_Check_Types.Background_Check_Type_ID`
  - `Certification_Type_ID` -> `Certification_Types.Certification_Type_ID`
  - `Milestone_ID` -> `Milestones.Milestone_ID`
  - `Custom_Form_ID` -> `Forms.Form_ID`

### vw_mp_Response_Qualifications

Access: Read | Permissions: DataExport

- **Primary Key:** `ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpResponseQualifications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpResponseQualificationsSchema.ts`
- **Foreign Keys:**
  - `Response_ID` -> `Responses.Response_ID`
  - `Group_Role_ID` -> `Group_Roles.Group_Role_ID`
  - `Participant_ID` -> `Participants.Participant_ID`

### vw_mp_User_Rights

Access: Read | Permissions: DataExport

- **Primary Key:** `View_ID`
- **Type:** `src/lib/providers/ministry-platform/models/VwMpUserRights.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/VwMpUserRightsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `User_ID` -> `dp_Users.User_ID`

### Weekly_Snapshots

Access: Read | Permissions: None

- **Primary Key:** `Weekly_Snapshot_ID`
- **Type:** `src/lib/providers/ministry-platform/models/WeeklySnapshots.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/WeeklySnapshotsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Wifi_Device_Sessions

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Wifi_Device_Session_ID`
- **Type:** `src/lib/providers/ministry-platform/models/WifiDeviceSessions.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/WifiDeviceSessionsSchema.ts`
- **Foreign Keys:**
  - `Wifi_Device_ID` -> `Wifi_Devices.Wifi_Device_ID`

### Wifi_Devices

Access: ReadWriteAssignDelete | Permissions: None

- **Primary Key:** `Wifi_Device_ID`
- **Type:** `src/lib/providers/ministry-platform/models/WifiDevices.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/WifiDevicesSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`

### Z_Event_Notifications

Access: Read | Permissions: None

- **Primary Key:** `Z_Event_Notifications_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ZEventNotifications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ZEventNotificationsSchema.ts`

### Z_Form_Notifications

Access: Read | Permissions: None

- **Primary Key:** `Z_Form_Notifications_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ZFormNotifications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ZFormNotificationsSchema.ts`

### Z_Opp_Notifications

Access: Read | Permissions: None

- **Primary Key:** `Z_Opp_Notifications_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ZOppNotifications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ZOppNotificationsSchema.ts`

