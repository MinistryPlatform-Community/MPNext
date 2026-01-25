/**
 * Interface for Care_Types
* Table: Care_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CareTypes {

  Care_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Care_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  User_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID
}

export type CareTypesRecord = CareTypes;
