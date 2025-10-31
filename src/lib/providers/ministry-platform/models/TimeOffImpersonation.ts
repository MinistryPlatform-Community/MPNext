/**
 * Interface for Time_Off_Impersonation
* Table: Time_Off_Impersonation
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface TimeOffImpersonation {

  Time_Off_Impersonation_ID: number /* 32-bit integer */; // Primary Key

  Supervisor_User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Employee_User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  _Added_Via_Routine: boolean; // Read Only, Has Default
}

export type TimeOffImpersonationRecord = TimeOffImpersonation;
