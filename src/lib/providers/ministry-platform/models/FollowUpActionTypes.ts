/**
 * Interface for Follow_Up_Action_Types
* Table: Follow_Up_Action_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface FollowUpActionTypes {

  Action_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Action_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type FollowUpActionTypesRecord = FollowUpActionTypes;
