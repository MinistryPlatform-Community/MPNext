# Ministry Platform Schema Reference

This document provides a summary of Ministry Platform database tables for LLM assistants working on the MPNext project.

**Generated:** 2026-01-25T00:39:03.980Z
**Tables:** 126

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

### Activity_Log_Staging

Access: Read | Permissions: None

- **Primary Key:** `Activity_Log_Staging_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ActivityLogStaging.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ActivityLogStagingSchema.ts`

### Addresses

Access: ReadWrite | Permissions: None

- **Primary Key:** `Address_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Addresses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AddressesSchema.ts`

### Attributes

Access: ReadWrite | Permissions: None

- **Primary Key:** `Attribute_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Attributes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AttributesSchema.ts`
- **Foreign Keys:**
  - `Attribute_Type_ID` -> `Attribute_Types.Attribute_Type_ID`

### Audience_Members_Staging

Access: Read | Permissions: None

- **Primary Key:** `Contact_Id`
- **Type:** `src/lib/providers/ministry-platform/models/AudienceMembersStaging.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/AudienceMembersStagingSchema.ts`

### Background_Check_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Background_Check_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BackgroundCheckStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BackgroundCheckStatusesSchema.ts`

### Batch_Entry_Types

Access: Read | Permissions: None

- **Primary Key:** `Batch_Entry_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BatchEntryTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BatchEntryTypesSchema.ts`

### Batch_Usage_Types

Access: Read | Permissions: None

- **Primary Key:** `Batch_Usage_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/BatchUsageTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/BatchUsageTypesSchema.ts`

### Care_Outcomes

Access: Read | Permissions: None

- **Primary Key:** `Care_Outcome_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CareOutcomes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CareOutcomesSchema.ts`

### Checkin_Search_Results_Types

Access: Read | Permissions: None

- **Primary Key:** `Checkin_Search_Results_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/CheckinSearchResultsTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/CheckinSearchResultsTypesSchema.ts`

### Congregations

Access: Read | Permissions: None

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

Access: ReadWrite | Permissions: None

- **Primary Key:** `Contact_Attribute_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactAttributes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactAttributesSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Attribute_ID` -> `Attributes.Attribute_ID`

### Contact_Log_Types

Access: Read | Permissions: None

- **Primary Key:** `Contact_Log_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactLogTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactLogTypesSchema.ts`

### Contact_Statuses

Access: ReadWrite | Permissions: None

- **Primary Key:** `Contact_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ContactStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ContactStatusesSchema.ts`

### Contacts

Access: ReadWrite | Permissions: FileAttach

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

### Contribution_Statements

Access: ReadWrite | Permissions: FileAttach

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

### Date_Accuracies

Access: Read | Permissions: None

- **Primary Key:** `Date_Accuracy_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DateAccuracies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DateAccuraciesSchema.ts`

### Donation_Distributions

Access: Read | Permissions: None

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

### Donors

Access: ReadWrite | Permissions: None

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

### dp_Application_Labels

Access: Read | Permissions: None

- **Primary Key:** `Application_Label_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpApplicationLabels.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpApplicationLabelsSchema.ts`
- **Foreign Keys:**
  - `API_Client_ID` -> `dp_API_Clients.API_Client_ID`

### dp_Communication_Publications

Access: ReadWrite | Permissions: None

- **Primary Key:** `Communication_Publication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpCommunicationPublications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpCommunicationPublicationsSchema.ts`
- **Foreign Keys:**
  - `Communication_ID` -> `dp_Communications.Communication_ID`
  - `Publication_ID` -> `dp_Publications.Publication_ID`

### dp_Communications

Access: ReadWrite | Permissions: None

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

### dp_Configuration_Settings

Access: Read | Permissions: None

- **Primary Key:** `Configuration_Setting_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpConfigurationSettings.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpConfigurationSettingsSchema.ts`
- **Foreign Keys:**
  - `Primary_Key_Page_ID` -> `dp_Pages.Page_ID`

### dp_Contact_Publications

Access: ReadWrite | Permissions: None

- **Primary Key:** `Contact_Publication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpContactPublications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpContactPublicationsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Publication_ID` -> `dp_Publications.Publication_ID`

### dp_Publications

Access: ReadWrite | Permissions: None

- **Primary Key:** `Publication_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpPublications.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpPublicationsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Moderator` -> `dp_Users.User_ID`

### dp_Users

Access: Read | Permissions: None

- **Primary Key:** `User_ID`
- **Type:** `src/lib/providers/ministry-platform/models/DpUsers.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/DpUsersSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Supervisor` -> `dp_Users.User_ID`

### Equipment_Types

Access: Read | Permissions: None

- **Primary Key:** `Equipment_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EquipmentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EquipmentTypesSchema.ts`

### Event_Participants

Access: ReadWriteAssignDelete | Permissions: None

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

Access: Read | Permissions: None

- **Primary Key:** `Event_Room_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventRooms.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventRoomsSchema.ts`
- **Foreign Keys:**
  - `Event_ID` -> `Events.Event_ID`
  - `Room_ID` -> `Rooms.Room_ID`
  - `Group_ID` -> `Groups.Group_ID`
  - `Room_Layout_ID` -> `Room_Layouts.Room_Layout_ID`

### Event_Types

Access: Read | Permissions: None

- **Primary Key:** `Event_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/EventTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/EventTypesSchema.ts`

### Events

Access: ReadWrite | Permissions: None

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

### Feedback_Entries

Access: ReadWrite | Permissions: None

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

Access: Read | Permissions: None

- **Primary Key:** `Form_Field_ID`
- **Type:** `src/lib/providers/ministry-platform/models/FormFields.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FormFieldsSchema.ts`
- **Foreign Keys:**
  - `Field_Type_ID` -> `Form_Field_Types.Form_Field_Type_ID`
  - `Form_ID` -> `Forms.Form_ID`
  - `Depends_On` -> `Form_Fields.Form_Field_ID`

### Form_Response_Answers

Access: ReadWriteAssignDelete | Permissions: FileAttach

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

Access: ReadWriteAssignDelete | Permissions: None

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

Access: ReadWrite | Permissions: None

- **Primary Key:** `Form_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Forms.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/FormsSchema.ts`
- **Foreign Keys:**
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Primary_Contact` -> `Contacts.Contact_ID`
  - `Response_Message` -> `dp_Communication_Templates.Communication_Template_ID`

### Frequencies

Access: Read | Permissions: None

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

### Group_Focuses

Access: Read | Permissions: None

- **Primary Key:** `Group_Focus_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupFocuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupFocusesSchema.ts`

### Group_Inquiries

Access: ReadWrite | Permissions: None

- **Primary Key:** `Group_Inquiry_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupInquiries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupInquiriesSchema.ts`
- **Foreign Keys:**
  - `Group_ID` -> `Groups.Group_ID`
  - `Contact_ID` -> `Contacts.Contact_ID`

### Group_Participants

Access: ReadWrite | Permissions: None

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

### Group_Types

Access: Read | Permissions: None

- **Primary Key:** `Group_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/GroupTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/GroupTypesSchema.ts`
- **Foreign Keys:**
  - `Default_Role` -> `Group_Roles.Group_Role_ID`

### Groups

Access: ReadWrite | Permissions: None

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

### Household_Positions

Access: Read | Permissions: None

- **Primary Key:** `Household_Position_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdPositions.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdPositionsSchema.ts`

### Household_Sources

Access: Read | Permissions: None

- **Primary Key:** `Household_Source_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdSources.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdSourcesSchema.ts`

### Household_Types

Access: Read | Permissions: None

- **Primary Key:** `Household_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/HouseholdTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/HouseholdTypesSchema.ts`

### Households

Access: ReadWrite | Permissions: None

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

Access: Read | Permissions: None

- **Primary Key:** `Import_Destination_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ImportDestinations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ImportDestinationsSchema.ts`

### Industries

Access: Read | Permissions: None

- **Primary Key:** `Industry_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Industries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/IndustriesSchema.ts`

### Invoice_Detail

Access: ReadWriteAssignDelete | Permissions: None

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

Access: ReadWriteAssignDelete | Permissions: None

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

### Life_Stages

Access: Read | Permissions: None

- **Primary Key:** `Life_Stage_ID`
- **Type:** `src/lib/providers/ministry-platform/models/LifeStages.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/LifeStagesSchema.ts`

### Locations

Access: Read | Permissions: None

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

### Meeting_Frequencies

Access: Read | Permissions: None

- **Primary Key:** `Meeting_Frequency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MeetingFrequencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MeetingFrequenciesSchema.ts`

### Member_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Member_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/MemberStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MemberStatusesSchema.ts`

### Milestones

Access: Read | Permissions: None

- **Primary Key:** `Milestone_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Milestones.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MilestonesSchema.ts`
- **Foreign Keys:**
  - `Journey_ID` -> `Journeys.Journey_ID`
  - `Next_Milestone` -> `Milestones.Milestone_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`

### Ministries

Access: Read | Permissions: None

- **Primary Key:** `Ministry_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Ministries.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/MinistriesSchema.ts`
- **Foreign Keys:**
  - `Primary_Contact` -> `Contacts.Contact_ID`
  - `Parent_Ministry` -> `Ministries.Ministry_ID`
  - `Priority_ID` -> `Priorities.Priority_ID`
  - `Leadership_Team` -> `Groups.Group_ID`

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

### Occupations

Access: Read | Permissions: None

- **Primary Key:** `Occupation_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Occupations.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/OccupationsSchema.ts`

### Opportunities

Access: ReadWrite | Permissions: None

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

### Ordination_Types

Access: Read | Permissions: None

- **Primary Key:** `Ordination_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/OrdinationTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/OrdinationTypesSchema.ts`

### Participant_Engagement

Access: Read | Permissions: None

- **Primary Key:** `Participant_Engagement_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipantEngagement.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantEngagementSchema.ts`

### Participant_Milestones

Access: ReadWrite | Permissions: None

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

Access: Read | Permissions: None

- **Primary Key:** `Participant_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipantTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantTypesSchema.ts`
- **Foreign Keys:**
  - `Set_Inactivated_To` -> `Participant_Types.Participant_Type_ID`
  - `Set_Reactivated_To` -> `Participant_Types.Participant_Type_ID`

### Participants

Access: ReadWrite | Permissions: None

- **Primary Key:** `Participant_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Participants.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipantsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Participant_Type_ID` -> `Participant_Types.Participant_Type_ID`
  - `Member_Status_ID` -> `Member_Statuses.Member_Status_ID`
  - `Participant_Engagement_ID` -> `Participant_Engagement.Participant_Engagement_ID`
  - `Church_of_Record` -> `Households.Household_ID`

### Participation_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Participation_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ParticipationStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ParticipationStatusesSchema.ts`

### Payment_Detail

Access: ReadWrite | Permissions: None

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

Access: ReadWrite | Permissions: None

- **Primary Key:** `Payment_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Payments.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PaymentsSchema.ts`
- **Foreign Keys:**
  - `Contact_ID` -> `Contacts.Contact_ID`
  - `Payment_Type_ID` -> `Payment_Types.Payment_Type_ID`
  - `Congregation_ID` -> `Congregations.Congregation_ID`
  - `Invoice_ID` -> `Invoices.Invoice_ID`

### Personnel_Categories

Access: Read | Permissions: None

- **Primary Key:** `Personnel_Category_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PersonnelCategories.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PersonnelCategoriesSchema.ts`

### Perspectives

Access: Read | Permissions: None

- **Primary Key:** `Perspective_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Perspectives.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PerspectivesSchema.ts`

### Pledge_Adjustment_Types

Access: Read | Permissions: None

- **Primary Key:** `Pledge_Adjustment_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeAdjustmentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeAdjustmentTypesSchema.ts`

### Pledge_Campaign_Types

Access: Read | Permissions: None

- **Primary Key:** `Pledge_Campaign_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeCampaignTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeCampaignTypesSchema.ts`

### Pledge_Campaigns

Access: Read | Permissions: None

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

Access: Read | Permissions: None

- **Primary Key:** `Pledge_Frequency_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeFrequencies.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeFrequenciesSchema.ts`

### Pledge_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Pledge_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/PledgeStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/PledgeStatusesSchema.ts`

### Pledges

Access: ReadWrite | Permissions: None

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

### Program_Types

Access: Read | Permissions: None

- **Primary Key:** `Program_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ProgramTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ProgramTypesSchema.ts`

### Programs

Access: Read | Permissions: None

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

### Request_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Request_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/RequestStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RequestStatusesSchema.ts`

### Response_Results

Access: Read | Permissions: None

- **Primary Key:** `Response_Result_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ResponseResults.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ResponseResultsSchema.ts`

### Responses

Access: ReadWrite | Permissions: None

- **Primary Key:** `Response_ID`
- **Type:** `src/lib/providers/ministry-platform/models/Responses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ResponsesSchema.ts`
- **Foreign Keys:**
  - `Opportunity_ID` -> `Opportunities.Opportunity_ID`
  - `Participant_ID` -> `Participants.Participant_ID`
  - `Response_Result_ID` -> `Response_Results.Response_Result_ID`
  - `Event_ID` -> `Events.Event_ID`

### Room_Usage_Types

Access: Read | Permissions: None

- **Primary Key:** `Room_Usage_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/RoomUsageTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RoomUsageTypesSchema.ts`

### RSVP_Statuses

Access: Read | Permissions: None

- **Primary Key:** `RSVP_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/RsvpStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/RsvpStatusesSchema.ts`

### Sacrament_Types

Access: Read | Permissions: None

- **Primary Key:** `Sacrament_Type_ID`
- **Type:** `src/lib/providers/ministry-platform/models/SacramentTypes.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/SacramentTypesSchema.ts`

### Schedule_Statuses

Access: Read | Permissions: None

- **Primary Key:** `Schedule_Status_ID`
- **Type:** `src/lib/providers/ministry-platform/models/ScheduleStatuses.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/ScheduleStatusesSchema.ts`

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

Access: Read | Permissions: None

- **Primary Key:** `Texting_Compliance_Level_ID`
- **Type:** `src/lib/providers/ministry-platform/models/TextingComplianceLevels.ts`
- **Schema:** `src/lib/providers/ministry-platform/models/TextingComplianceLevelsSchema.ts`

### Texting_Opt_In_Types

Access: Read | Permissions: None

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

