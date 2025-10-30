/**
 * Interface for Contacts
* Table: Contacts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Contacts {

  Contact_ID: number /* 32-bit integer */; // Primary Key

  Company: boolean;

  /**
   * Max length: 50 characters
   */
  Company_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 125 characters
   */
  Display_Name: string /* max 125 chars */;

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

  Household_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Households.Household_ID

  Household_Position_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Household_Positions.Household_Position_ID

  Anniversary_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Date_of_Death?: string /* ISO date (YYYY-MM-DD) */ | null;

  Participant_Record?: number /* 32-bit integer */ | null; // Foreign Key -> Participants.Participant_ID

  Donor_Record?: number /* 32-bit integer */ | null; // Foreign Key -> Donors.Donor_ID

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* email, max 254 chars */ | null;

  Mobile_Phone?: string /* phone number */ | null;

  Company_Phone?: string /* phone number */ | null;

  Pager_Phone?: string /* phone number */ | null;

  Fax_Phone?: string /* phone number */ | null;

  /**
   * Max length: 50 characters
   */
  Facebook_Account?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Twitter_Account?: string /* max 50 chars */ | null;

  Web_Page?: string /* URL */ | null;

  Industry_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Industries.Industry_ID

  Occupation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Occupations.Occupation_ID

  /**
   * Max length: 75 characters
   */
  Current_School?: string /* max 75 chars */ | null;

  HS_Graduation_Year?: number /* 16-bit integer */ | null;

  Bulk_Email_Opt_Out: boolean; // Has Default

  Email_Unlisted: boolean; // Has Default

  Do_Not_Text: boolean; // Has Default

  Mobile_Phone_Unlisted: boolean; // Has Default

  Remove_From_Directory: boolean; // Has Default

  User_Account?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 50 characters
   */
  ID_Card?: string /* max 50 chars */ | null;

  Contact_GUID: string /* GUID/UUID */; // Has Default

  _Contact_Setup_Date: string /* ISO datetime */; // Read Only, Has Default

  Email_Verified: boolean; // Has Default

  Mobile_Phone_Verified: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Maiden_Name?: string /* max 50 chars */ | null;

  Primary_Language_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Primary_Languages.Primary_Language_ID

  Faith_Background_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Faith_Backgrounds.Faith_Background_ID

  Texting_Opt_In_Type_ID: number /* 32-bit integer */; // Foreign Key -> Texting_Opt_In_Types.Texting_Opt_In_Type_ID, Has Default
}

export type ContactsRecord = Contacts;
