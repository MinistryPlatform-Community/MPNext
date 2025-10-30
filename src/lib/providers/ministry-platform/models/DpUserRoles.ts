/**
 * Interface for dp_User_Roles
* Table: dp_User_Roles
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpUserRoles {

  User_Role_ID: number /* 32-bit integer */; // Primary Key

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Role_ID: number /* 32-bit integer */; // Foreign Key -> dp_Roles.Role_ID
}

export type DpUserRolesRecord = DpUserRoles;
