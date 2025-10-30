/**
 * Interface for Group_Focuses
* Table: Group_Focuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface GroupFocuses {

  Group_Focus_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Group_Focus: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type GroupFocusesRecord = GroupFocuses;
