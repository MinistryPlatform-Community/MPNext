/**
 * Interface for dp_SMS_Numbers
* Table: dp_SMS_Numbers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpSmsNumbers {

  SMS_Number_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Number_Title: string /* max 50 chars */;

  SMS_Number?: string /* phone number */ | null;

  Active: boolean; // Has Default

  Default: boolean; // Has Default

  User_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_User_Groups.User_Group_ID

  Primary_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Cost_Per_Message?: number /* decimal */ | null;
}

export type DpSmsNumbersRecord = DpSmsNumbers;
