/**
 * Interface for dp_Inbound_SMS
* Table: dp_Inbound_SMS
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpInboundSms {

  Inbound_SMS_ID: number /* 32-bit integer */; // Primary Key

  Event_Time: string /* ISO datetime */;

  /**
   * Max length: 64 characters
   */
  Message_ID: string /* max 64 chars */;

  /**
   * Max length: 13 characters
   */
  Message_From: string /* max 13 chars */;

  /**
   * Max length: 1024 characters
   */
  Message_To: string /* max 1024 chars */;

  /**
   * Max length: 2048 characters
   */
  Message_Text?: string /* max 2048 chars */ | null;

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Last_Message_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Messages.Communication_Message_ID
}

export type DpInboundSmsRecord = DpInboundSms;
