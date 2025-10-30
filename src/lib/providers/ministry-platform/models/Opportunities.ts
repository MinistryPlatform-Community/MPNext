/**
 * Interface for Opportunities
* Table: Opportunities
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Opportunities {

  Opportunity_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Opportunity_Title: string /* max 50 chars */;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  Group_Role_ID: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Program_ID: number /* 32-bit integer */; // Foreign Key -> Programs.Program_ID

  Visibility_Level_ID: number /* 32-bit integer */; // Foreign Key -> Visibility_Levels.Visibility_Level_ID

  Contact_Person: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Publish_Date: string /* ISO datetime */;

  Opportunity_Date?: string /* ISO datetime */ | null;

  Duration_in_Hours?: number /* 16-bit integer */ | null;

  Add_to_Group?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Add_to_Event?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Required_Gender?: number /* 32-bit integer */ | null; // Foreign Key -> Genders.Gender_ID

  Minimum_Age?: unknown | null;

  Minimum_Needed?: number /* 16-bit integer */ | null;

  Maximum_Needed?: number /* 16-bit integer */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Letter_Body?: string /* max 2147483647 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Letter_From?: string /* max 2147483647 chars */ | null;

  On_Connection_Card: boolean; // Has Default

  Shift_Start?: string /* ISO time (HH:MM:SS) */ | null;

  Shift_End?: string /* ISO time (HH:MM:SS) */ | null;

  Custom_Form?: number /* 32-bit integer */ | null; // Foreign Key -> Forms.Form_ID

  Response_Message?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Close_Responses: boolean; // Has Default

  Date_To_Remind?: string /* ISO date (YYYY-MM-DD) */ | null;

  Optional_Reminder_Message?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Send_To_Heads?: boolean | null; // Has Default

  _Maximum_Needed_Met: boolean; // Read Only, Has Default
}

export type OpportunitiesRecord = Opportunities;
