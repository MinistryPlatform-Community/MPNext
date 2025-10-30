/**
 * Interface for dp_Processes
* Table: dp_Processes
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpProcesses {

  Process_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Process_Name: string /* max 50 chars */;

  Process_Manager: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Active: boolean;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  /**
   * Max length: 500 characters
   */
  On_Submit?: string /* max 500 chars */ | null;

  /**
   * Max length: 500 characters
   */
  On_Complete?: string /* max 500 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Trigger_Fields?: string /* max 255 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Dependent_Condition?: string /* max 4000 chars */ | null;

  Trigger_On_Create: boolean; // Has Default

  Trigger_On_Update: boolean; // Has Default

  Table_Name: unknown;
}

export type DpProcessesRecord = DpProcesses;
