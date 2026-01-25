/**
 * Interface for Group_Role_Types
* Table: Group_Role_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupRoleTypes {

  Group_Role_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Group_Role_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type GroupRoleTypesRecord = GroupRoleTypes;
