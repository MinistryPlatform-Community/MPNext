/**
 * Interface for Events
* Table: Events
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Events {

  Event_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Event_Title: string /* max 75 chars */;

  Event_Type_ID: number /* 32-bit integer */; // Foreign Key -> Event_Types.Event_Type_ID

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  Location_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Locations.Location_ID

  /**
   * Max length: 4000 characters
   */
  Meeting_Instructions?: string /* max 4000 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  Program_ID: number /* 32-bit integer */; // Foreign Key -> Programs.Program_ID

  Primary_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Participants_Expected?: number /* 32-bit integer */ | null;

  Minutes_for_Setup: number /* 16-bit integer */; // Has Default

  Event_Start_Date: string /* ISO datetime */;

  Event_End_Date: string /* ISO datetime */;

  Minutes_for_Cleanup: number /* 16-bit integer */; // Has Default

  Cancelled: boolean; // Has Default

  _Approved?: boolean | null; // Read Only

  Visibility_Level_ID: number /* 32-bit integer */; // Foreign Key -> Visibility_Levels.Visibility_Level_ID, Has Default

  Featured_On_Calendar: boolean; // Has Default

  Online_Registration_Product?: number /* 32-bit integer */ | null; // Foreign Key -> Products.Product_ID

  Registration_Form?: number /* 32-bit integer */ | null; // Foreign Key -> Forms.Form_ID

  Registration_Start?: string /* ISO datetime */ | null;

  Registration_End?: string /* ISO datetime */ | null;

  Registration_Active: boolean; // Has Default

  Register_Into_Series: boolean; // Has Default

  External_Registration_URL?: string /* URL */ | null;

  _Web_Approved?: boolean | null; // Read Only

  Force_Login: boolean; // Has Default

  "Allow_Check-in": boolean; // Has Default

  Ignore_Program_Groups: boolean; // Has Default

  Prohibit_Guests: boolean; // Has Default

  Search_Results: number /* 32-bit integer */; // Foreign Key -> Checkin_Search_Results_Types.Checkin_Search_Results_Type_ID, Has Default

  "Early_Check-in_Period"?: number /* 16-bit integer */ | null;

  "Late_Check-in_Period"?: number /* 16-bit integer */ | null;

  Registrant_Message?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Days_Out_to_Remind?: number /* 32-bit integer */ | null;

  Optional_Reminder_Message?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Attendee_Message?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Send_To_Heads: boolean; // Has Default

  Parent_Event_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Priority_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Priorities.Priority_ID

  On_Connection_Card: boolean; // Has Default

  On_Donation_Batch_Tool: boolean; // Has Default

  /**
   * Max length: 15 characters
   */
  Project_Code?: string /* max 15 chars */ | null;

  /**
   * Max length: 2083 characters
   */
  Online_Meeting_Link?: string /* max 2083 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Read_More_URL?: string /* max 1000 chars */ | null;

  Allow_Self_Checkin: boolean; // Has Default

  Minor_Registration: boolean; // Has Default

  Allow_Email: boolean; // Has Default

  Show_Building_Room_Info: boolean; // Has Default

  Allow_QR_Check_In: boolean; // Has Default

  /**
   * Max length: 300 characters
   */
  QR_Redirect_Url?: string /* max 300 chars */ | null;

  Allow_Fastpass: boolean; // Has Default
}

export type EventsRecord = Events;
