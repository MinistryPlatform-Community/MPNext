/**
 * Interface for Group_Role_Directions
* Table: Group_Role_Directions
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupRoleDirections {

  Group_Role_Direction_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Group_Role_Direction: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type GroupRoleDirectionsRecord = GroupRoleDirections;
