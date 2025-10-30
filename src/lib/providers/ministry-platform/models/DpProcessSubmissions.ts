/**
 * Interface for dp_Process_Submissions
* Table: dp_Process_Submissions
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpProcessSubmissions {

  Process_Submission_ID: number /* 32-bit integer */; // Primary Key

  Submitted_By: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Date_Submitted: string /* ISO datetime */;

  Process_ID: number /* 32-bit integer */; // Foreign Key -> dp_Processes.Process_ID

  Process_Submission_Status_ID: number /* 32-bit integer */; // Foreign Key -> dp_Process_Submission_Statuses.Process_Submission_Status_ID

  _Record_ID: number /* 32-bit integer */;
}

export type DpProcessSubmissionsRecord = DpProcessSubmissions;
