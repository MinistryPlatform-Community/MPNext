/**
 * Interface for bp_Class_Assignments
* Table: bp_Class_Assignments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BpClassAssignments {

  Assignment_ID: number /* 32-bit integer */; // Primary Key

  Class_ID: number /* 32-bit integer */; // Foreign Key -> bp_Course_Classes.Class_ID

  /**
   * Max length: 100 characters
   */
  Title?: string /* max 100 chars */ | null;

  /**
   * Max length: 100 characters
   */
  Subtitle?: string /* max 100 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Link_URL?: string /* max 150 chars */ | null;

  Display_Order?: number /* 32-bit integer */ | null;

  Required_To_Complete_Class: boolean; // Has Default
}

export type BpClassAssignmentsRecord = BpClassAssignments;
