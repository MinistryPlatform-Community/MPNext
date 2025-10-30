/**
 * Interface for dp_User_Global_Filters
* Table: dp_User_Global_Filters
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpUserGlobalFilters {

  dp_User_Global_Filter_ID: number /* 32-bit integer */; // Primary Key

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Global_Filter_ID: unknown;
}

export type DpUserGlobalFiltersRecord = DpUserGlobalFilters;
