/**
 * Interface for dp_Communications
* Table: dp_Communications
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpCommunications {

  Communication_ID: number /* 32-bit integer */; // Primary Key

  Author_User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Communication_Type_ID: number /* 32-bit integer */; // Foreign Key -> dp_Communication_Types.Communication_Type_ID, Has Default

  Communication_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Statuses.Communication_Status_ID, Has Default

  Selection_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Selections.Selection_ID

  Send_To_Parents: boolean; // Has Default

  /**
   * Max length: 1000 characters
   */
  Subject: string /* max 1000 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Body: string /* max 2147483647 chars */;

  Pertains_To_Page_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Pages.Page_ID

  _Sent_From_Task?: number /* 32-bit integer */ | null; // Read Only

  To_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  From_SMS_Number?: number /* 32-bit integer */ | null; // Foreign Key -> dp_SMS_Numbers.SMS_Number_ID

  From_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Reply_to_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Start_Date: string /* ISO datetime */; // Has Default

  Time_Zone?: unknown | null;

  Locale?: unknown | null;

  Bulk_Email: boolean; // Has Default

  Template: boolean; // Has Default

  Active: boolean; // Has Default

  Expire_Date?: string /* ISO datetime */ | null;

  Template_User?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Template_User_Group?: number /* 32-bit integer */ | null; // Foreign Key -> dp_User_Groups.User_Group_ID

  Communication_GUID: string /* GUID/UUID */; // Has Default

  Alternate_Email_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Alternate_Email_Types.Alternate_Email_Type_ID

  Publication_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Publications.Publication_ID
}

export type DpCommunicationsRecord = DpCommunications;
