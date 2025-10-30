/**
 * Interface for Group_Ended_Reasons
* Table: Group_Ended_Reasons
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface GroupEndedReasons {

  Group_Ended_Reason_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Group_Ended_Reason: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type GroupEndedReasonsRecord = GroupEndedReasons;
