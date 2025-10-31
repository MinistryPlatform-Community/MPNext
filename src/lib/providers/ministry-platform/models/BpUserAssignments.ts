/**
 * Interface for bp_User_Assignments
* Table: bp_User_Assignments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface BpUserAssignments {

  User_Assignment_ID: number /* 32-bit integer */; // Primary Key

  Assignment_ID: number /* 32-bit integer */; // Foreign Key -> bp_Class_Assignments.Assignment_ID

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Date_Completed?: string /* ISO datetime */ | null;
}

export type BpUserAssignmentsRecord = BpUserAssignments;
