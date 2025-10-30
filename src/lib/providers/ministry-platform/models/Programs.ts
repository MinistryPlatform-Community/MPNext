/**
 * Interface for Programs
* Table: Programs
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Programs {

  Program_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 130 characters
   */
  Program_Name: string /* max 130 chars */;

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  Ministry_ID: number /* 32-bit integer */; // Foreign Key -> Ministries.Ministry_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Program_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Program_Types.Program_Type_ID

  Leadership_Team?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Primary_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Priority_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Priorities.Priority_ID

  On_Connection_Card: boolean; // Has Default

  Tax_Deductible_Donations: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Statement_Title: string /* max 50 chars */;

  Statement_Header_ID: number /* 32-bit integer */; // Foreign Key -> Statement_Headers.Statement_Header_ID

  Allow_Online_Giving: boolean; // Has Default

  Online_Sort_Order?: number /* 16-bit integer */ | null;

  Pledge_Campaign_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  /**
   * Max length: 25 characters
   */
  Account_Number?: string /* max 25 chars */ | null;

  Default_Target_Event?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  On_Donation_Batch_Tool: boolean; // Has Default

  Available_Online: boolean; // Has Default

  Omit_From_Engagement_Giving: boolean; // Has Default

  SMS_Number?: number /* 32-bit integer */ | null; // Foreign Key -> dp_SMS_Numbers.SMS_Number_ID

  /**
   * Max length: 1000 characters
   */
  OLG_Fund?: string /* max 1000 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  OLG_Sub_Fund?: string /* max 1000 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Vision2_Program_ID?: string /* max 1000 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Vanco_Campaign_ID?: string /* max 255 chars */ | null;
}

export type ProgramsRecord = Programs;
