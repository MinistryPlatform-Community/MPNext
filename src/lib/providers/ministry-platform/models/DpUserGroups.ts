/**
 * Interface for dp_User_Groups
* Table: dp_User_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpUserGroups {

  User_Group_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  User_Group_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Moderator?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID
}

export type DpUserGroupsRecord = DpUserGroups;
