/**
 * Interface for Group_Roles
* Table: Group_Roles
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface GroupRoles {

  Group_Role_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Role_Title: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Group_Role_Type_ID: number /* 32-bit integer */; // Foreign Key -> Group_Role_Types.Group_Role_Type_ID

  Group_Role_Direction_ID: number /* 32-bit integer */; // Foreign Key -> Group_Role_Directions.Group_Role_Direction_ID

  Group_Role_Intensity_ID: number /* 32-bit integer */; // Foreign Key -> Group_Role_Intensities.Group_Role_Intensity_ID

  Ministry_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Ministries.Ministry_ID

  Background_Check_Required: boolean; // Has Default

  Omit_From_Portal?: boolean | null;

  Manages_Volunteers: boolean; // Has Default
}

export type GroupRolesRecord = GroupRoles;
