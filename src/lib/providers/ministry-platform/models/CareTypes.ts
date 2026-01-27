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

  Move_to_Feedback?: boolean | null;

  Move_to_Contact_Log?: boolean | null;

  Move_to_Opportunity_Responses?: boolean | null;

  Assign_to_Program?: number /* 32-bit integer */ | null; // Foreign Key -> Programs.Program_ID
}

export type CareTypesRecord = CareTypes;
