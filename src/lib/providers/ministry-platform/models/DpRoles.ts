/**
 * Interface for dp_Roles
* Table: dp_Roles
 * Access Level: ReadWriteAssign
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpRoles {

  Role_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 35 characters
   */
  Role_Name: string /* max 35 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Mass_Email_Quota?: number /* 32-bit integer */ | null;

  Mass_Text_Quota?: number /* 32-bit integer */ | null;

  Role_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Role_Types.Role_Type_ID

  Parish_Assignable: boolean; // Has Default

  Texting_Override: boolean; // Has Default
}

export type DpRolesRecord = DpRoles;
