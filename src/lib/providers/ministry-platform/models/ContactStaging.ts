/**
 * Interface for Contact_Staging
* Table: Contact_Staging
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface ContactStaging {

  Contact_Staging_ID: number /* 32-bit integer */; // Primary Key

  Ignore: boolean; // Has Default

  Imported?: boolean | null;

  Finalized?: boolean | null;

  /**
   * Max length: 75 characters
   */
  Display_Name: string /* max 75 chars */;

  Existing_Contact_Record?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 50 characters
   */
  External_ID?: string /* max 50 chars */ | null;

  ExternalFamilyID?: number /* 32-bit integer */ | null;

  Company: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Company_Name?: string /* max 50 chars */ | null;

  Prefix_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Prefixes.Prefix_ID

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Middle_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  Suffix_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Suffixes.Suffix_ID

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  Date_of_Birth?: string /* ISO date (YYYY-MM-DD) */ | null;

  Gender_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Genders.Gender_ID

  Marital_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Marital_Statuses.Marital_Status_ID

  Contact_Status_ID: number /* 32-bit integer */; // Foreign Key -> Contact_Statuses.Contact_Status_ID, Has Default

  Existing_Household_Record?: number /* 32-bit integer */ | null; // Foreign Key -> Households.Household_ID

  Household_Position_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Household_Positions.Household_Position_ID

  Existing_Participant_Record?: number /* 32-bit integer */ | null;

  Participant_Start_Date?: string /* ISO datetime */ | null; // Has Default

  Participant_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Participant_Types.Participant_Type_ID

  /**
   * Max length: 1000 characters
   */
  Participant_Notes?: string /* max 1000 chars */ | null;

  Existing_Donor_Record?: number /* 32-bit integer */ | null;

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* max 254 chars */ | null;

  Bulk_Email_Opt_Out: boolean; // Has Default

  Mobile_Phone?: string /* phone number */ | null;

  Company_Phone?: string /* phone number */ | null;

  Pager_Phone?: string /* phone number */ | null;

  Fax_Phone?: string /* phone number */ | null;

  Existing_User_Account?: number /* 32-bit integer */ | null;

  Web_Page?: string /* URL */ | null;

  Anniversary_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  HS_Graduation_Year?: number /* 16-bit integer */ | null;

  Home_Phone?: string /* phone number */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Existing_Address_Record?: number /* 32-bit integer */ | null;

  /**
   * Max length: 75 characters
   */
  Address_Line_1?: string /* max 75 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Address_Line_2?: string /* max 75 chars */ | null;

  /**
   * Max length: 50 characters
   */
  City?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  "State/Region"?: string /* max 50 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Postal_Code?: string /* max 15 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Foreign_Country?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  ID_Card?: string /* max 50 chars */ | null;

  Date_of_Death?: string /* ISO date (YYYY-MM-DD) */ | null;

  _Contact_Setup_Date?: string /* ISO datetime */ | null; // Read Only
}

export type ContactStagingRecord = ContactStaging;
