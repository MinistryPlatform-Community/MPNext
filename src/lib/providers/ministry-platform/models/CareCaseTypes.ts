/**
 * Interface for Care_Case_Types
* Table: Care_Case_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface CareCaseTypes {

  Care_Case_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Care_Case_Type: string /* max 128 chars */;

  /**
   * Max length: 512 characters
   */
  Description?: string /* max 512 chars */ | null;

  Care_Group?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID
}

export type CareCaseTypesRecord = CareCaseTypes;
