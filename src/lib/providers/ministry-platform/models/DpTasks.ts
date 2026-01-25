/**
 * Interface for dp_Tasks
* Table: dp_Tasks
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpTasks {

  Task_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Title?: string /* max 75 chars */ | null;

  Author_User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Assigned_User_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Start_Date?: string /* ISO datetime */ | null;

  End_Date?: string /* ISO datetime */ | null;

  Completed: boolean; // Has Default

  /**
   * Max length: 2147483647 characters
   */
  Description?: string /* max 2147483647 chars */ | null;

  _Record_ID?: number /* 32-bit integer */ | null; // Read Only

  _Process_Submission_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Process_Submissions.Process_Submission_ID, Read Only

  _Process_Step_ID?: number /* 32-bit integer */ | null; // Read Only

  _Rejected: boolean; // Read Only, Has Default

  _Escalated: boolean; // Read Only, Has Default

  /**
   * Max length: 256 characters
   */
  _Record_Description?: string /* max 256 chars */ | null; // Read Only

  /**
   * Max length: 50 characters
   */
  _Table_Name?: string /* max 50 chars */ | null; // Read Only

  _Hidden: boolean; // Read Only, Has Default

  Assigned_User_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_User_Groups.User_Group_ID

  Completion_Rule_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Completion_Rules.Completion_Rule_ID
}

export type DpTasksRecord = DpTasks;
