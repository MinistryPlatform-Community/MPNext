/**
 * Interface for Priorities
* Table: Priorities
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Priorities {

  Priority_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Priority_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Perspective_ID: number /* 32-bit integer */; // Foreign Key -> Perspectives.Perspective_ID

  Parent_Priority_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Priorities.Priority_ID
}

export type PrioritiesRecord = Priorities;
