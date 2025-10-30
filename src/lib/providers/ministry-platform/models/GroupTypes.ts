/**
 * Interface for Group_Types
* Table: Group_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface GroupTypes {

  Group_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Group_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Default_Role: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Activity_Log_Start_Date: boolean; // Has Default

  Show_On_Group_Finder: boolean; // Has Default

  Show_On_MPMobile: boolean; // Has Default

  Omit_From_Engagement_Group_Life: boolean; // Has Default

  Volunteer_Group: boolean; // Has Default
}

export type GroupTypesRecord = GroupTypes;
