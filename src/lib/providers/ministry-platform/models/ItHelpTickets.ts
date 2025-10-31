/**
 * Interface for IT_Help_Tickets
* Table: IT_Help_Tickets
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ItHelpTickets {

  IT_Help_Ticket_ID: number /* 32-bit integer */; // Primary Key

  Submitted_For: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Request_Date: string /* ISO datetime */; // Has Default

  Due_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 254 characters
   */
  Request_Title: string /* max 254 chars */;

  /**
   * Max length: 50 characters
   */
  Severity?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  System?: string /* max 50 chars */ | null;

  Assigned_User?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 4000 characters
   */
  Description?: string /* max 4000 chars */ | null;

  Url?: string /* URL */ | null;

  File1?: string /* URL */ | null;

  File2?: string /* URL */ | null;

  File3?: string /* URL */ | null;

  File4?: string /* URL */ | null;

  /**
   * Max length: 4000 characters
   */
  Resolution_Notes?: string /* max 4000 chars */ | null;

  Completed?: boolean | null;

  Enable_Conversation: boolean; // Has Default

  Conversation_Url?: string /* URL */ | null;
}

export type ItHelpTicketsRecord = ItHelpTickets;
