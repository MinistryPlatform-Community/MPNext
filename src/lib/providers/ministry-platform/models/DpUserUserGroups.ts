/**
 * Interface for dp_User_User_Groups
* Table: dp_User_User_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface DpUserUserGroups {

  User_User_Group_ID: number /* 32-bit integer */; // Primary Key

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  User_Group_ID: number /* 32-bit integer */; // Foreign Key -> dp_User_Groups.User_Group_ID
}

export type DpUserUserGroupsRecord = DpUserUserGroups;
