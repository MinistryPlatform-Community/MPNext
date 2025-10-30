/**
 * Interface for dp_Communication_Templates
* Table: dp_Communication_Templates
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpCommunicationTemplates {

  Communication_Template_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 256 characters
   */
  Template_Name: string /* max 256 chars */;

  /**
   * Max length: 256 characters
   */
  Subject_Text: string /* max 256 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Body_Html: string /* max 2147483647 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Body_Data?: string /* max 2147483647 chars */ | null;

  Pertains_To_Page_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Pages.Page_ID

  Template_User?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Template_User_Group?: number /* 32-bit integer */ | null; // Foreign Key -> dp_User_Groups.User_Group_ID

  Active: boolean; // Has Default

  From_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Reply_to_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Communication_Type_ID: number /* 32-bit integer */; // Foreign Key -> dp_Communication_Types.Communication_Type_ID, Has Default
}

export type DpCommunicationTemplatesRecord = DpCommunicationTemplates;
