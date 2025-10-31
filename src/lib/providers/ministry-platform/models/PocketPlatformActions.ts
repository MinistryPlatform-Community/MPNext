/**
 * Interface for Pocket_Platform_Actions
* Table: Pocket_Platform_Actions
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformActions {

  Action_ID: number /* 32-bit integer */; // Primary Key

  Action_Type_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Action_Types.Action_Type_ID

  Resource_Type_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Resource_Types.Resource_Type_ID

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 255 characters
   */
  Value: string /* max 255 chars */;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;
}

export type PocketPlatformActionsRecord = PocketPlatformActions;
