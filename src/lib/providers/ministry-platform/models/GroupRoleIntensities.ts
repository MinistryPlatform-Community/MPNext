/**
 * Interface for Group_Role_Intensities
* Table: Group_Role_Intensities
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupRoleIntensities {

  Group_Role_Intensity_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Group_Role_Intensity: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type GroupRoleIntensitiesRecord = GroupRoleIntensities;
