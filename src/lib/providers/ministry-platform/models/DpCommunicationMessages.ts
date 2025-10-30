/**
 * Interface for dp_Communication_Messages
* Table: dp_Communication_Messages
 * Access Level: ReadWriteAssign
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface DpCommunicationMessages {

  Communication_Message_ID: number /* 32-bit integer */; // Primary Key

  Communication_ID: number /* 32-bit integer */; // Foreign Key -> dp_Communications.Communication_ID

  Action_Status_ID: number /* 32-bit integer */; // Foreign Key -> dp_Communication_Action_Statuses.Action_Status_ID

  Action_Status_Time: string /* ISO datetime */;

  /**
   * Max length: 1024 characters
   */
  Action_Text?: string /* max 1024 chars */ | null;

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 256 characters
   */
  From: string /* max 256 chars */;

  /**
   * Max length: 256 characters
   */
  To: string /* max 256 chars */;

  /**
   * Max length: 256 characters
   */
  Reply_To?: string /* max 256 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Subject?: string /* max 1000 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Body?: string /* max 2147483647 chars */ | null;

  Deleted: boolean; // Has Default

  _Date_Submitted?: string /* ISO datetime */ | null; // Read Only

  _Priority: number /* 32-bit integer */; // Read Only, Has Default

  _Text_Segments?: number /* 32-bit integer */ | null; // Read Only
}

export type DpCommunicationMessagesRecord = DpCommunicationMessages;
